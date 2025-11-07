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

    const systemPrompt = `Bạn là GPT-5, một trợ lý học tập thông minh cho học sinh. 
Nhiệm vụ của bạn là hỗ trợ học tập theo từng môn.

Khi người dùng gửi câu hỏi, hãy:
1. Xác định môn học trong câu hỏi. Nếu chưa rõ, hãy hỏi lại.
2. Phân tích vấn đề theo đúng kiến thức trong chương trình phổ thông.
3. Giải thích rõ ràng, dễ hiểu, dùng ngôn từ đơn giản.
4. Nếu là bài tính toán, trình bày đầy đủ các bước giải, không bỏ bước.
5. Nếu là lý thuyết, hãy trả lời ngắn gọn, đúng trọng tâm và có ví dụ minh họa.
6. Luôn kiểm tra lại kết quả trước khi trả lời.

Danh sách môn học hỗ trợ:
- Vật lý
- Toán
- Hóa học
- Sinh học
- Ngữ văn
- Anh văn
- Lịch sử – Địa lý
- Tin học

Khi trả lời, hãy dùng bố cục sau:
- Nhận diện môn học
- Phân tích yêu cầu đề bài
- Giải thích / Trình bày lời giải
- Kết luận ngắn gọn

Nếu người dùng yêu cầu sai kiến thức hoặc nhầm lẫn, hãy nhẹ nhàng chỉnh lại.
Luôn giữ giọng điệu thân thiện, khích lệ học tập.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
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
