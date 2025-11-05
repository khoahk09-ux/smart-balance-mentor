import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, grade, topic, numQuestions = 10 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Bạn là một giáo viên chuyên nghiệp tạo bài kiểm tra cho học sinh Việt Nam.
    
Hãy tạo ${numQuestions} câu hỏi cho môn ${subject}, khối ${grade}${topic ? `, chủ đề: ${topic}` : ''}.

QUAN TRỌNG: Bài kiểm tra phải bao gồm cả 3 dạng câu hỏi:
1. Trắc nghiệm (Multiple Choice) - khoảng 60% số câu
2. Đúng/Sai (True/False) - khoảng 20% số câu  
3. Trả lời ngắn (Short Answer) - khoảng 20% số câu

Bạn PHẢI trả về kết quả theo ĐÚNG định dạng JSON sau:

{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Câu hỏi trắc nghiệm",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correctAnswer": 0,
      "explanation": "Giải thích"
    },
    {
      "type": "true_false",
      "question": "Câu hỏi đúng/sai",
      "correctAnswer": "true",
      "explanation": "Giải thích"
    },
    {
      "type": "short_answer",
      "question": "Câu hỏi trả lời ngắn",
      "correctAnswer": "Đáp án đúng",
      "explanation": "Giải thích"
    }
  ]
}

Yêu cầu:
- Câu hỏi phải phù hợp với chương trình học khối ${grade}
- Trắc nghiệm: 4 đáp án, correctAnswer là chỉ số (0-3)
- Đúng/Sai: correctAnswer là "true" hoặc "false"
- Trả lời ngắn: correctAnswer là chuỗi văn bản ngắn gọn
- Giải thích ngắn gọn, dễ hiểu cho học sinh
- Độ khó phù hợp với trình độ

CHỈ TRẢ VỀ JSON, KHÔNG THÊM TEXT HAY MARKDOWN.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Hãy tạo bài kiểm tra theo yêu cầu." }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_quiz",
              description: "Tạo bài kiểm tra gồm 3 dạng: trắc nghiệm, đúng/sai, và trả lời ngắn",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { 
                          type: "string",
                          enum: ["multiple_choice", "true_false", "short_answer"]
                        },
                        question: { type: "string" },
                        options: { 
                          type: "array",
                          items: { type: "string" }
                        },
                        correctAnswer: { 
                          anyOf: [
                            { type: "integer" },
                            { type: "string" }
                          ]
                        },
                        explanation: { type: "string" }
                      },
                      required: ["type", "question", "correctAnswer", "explanation"]
                    }
                  }
                },
                required: ["questions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_quiz" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Đã vượt quá giới hạn sử dụng, vui lòng thử lại sau." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Cần nạp thêm tín dụng vào workspace Lovable AI." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Lỗi kết nối AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));
    
    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const quizData = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify(quizData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Generate quiz error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Lỗi không xác định" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
