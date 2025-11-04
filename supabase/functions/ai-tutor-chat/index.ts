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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Bạn là một trợ lý AI giáo dục chuyên nghiệp cho học sinh Việt Nam, chuyên hỗ trợ học tập các môn:
- Toán
- Vật lý  
- Hóa học
- Văn
- Anh văn
- Sinh học
- Lịch sử
- Địa lý
- GDCD

Nhiệm vụ của bạn:
1. Giải đáp thắc mắc học tập một cách chi tiết, dễ hiểu
2. Giải thích các khái niệm phức tạp bằng ngôn ngữ đơn giản
3. Hướng dẫn giải bài tập từng bước
4. Tạo bài kiểm tra và câu hỏi ôn tập phù hợp với trình độ
5. Phân tích điểm yếu và đưa ra lời khuyên học tập

Phong cách giao tiếp:
- Thân thiện, động viên học sinh
- Giải thích rõ ràng, có ví dụ minh họa
- Kiên nhẫn, sẵn sàng giải thích lại nếu học sinh chưa hiểu
- Luôn khuyến khích tư duy độc lập

Hãy trả lời bằng tiếng Việt và giúp học sinh học tập hiệu quả hơn!`;

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
          ...messages,
        ],
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Lỗi không xác định" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
