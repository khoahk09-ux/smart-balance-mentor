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

    const systemPrompt = `Bạn là một trợ lý AI quản lý thời gian học tập cho học sinh.

Nhiệm vụ của bạn là tạo ra thời khóa biểu học tập mỗi ngày gồm 3 phần rõ ràng:

1. Lịch học trên trường: 
- Lấy dữ liệu từ phần "Thời khóa biểu trên trường" mà người dùng đã nhập.
- Hiển thị theo dạng: Thứ - Môn - Giờ học.

2. Lịch học thêm:
- Lấy dữ liệu từ mục "Lịch học thêm".
- Hiển thị theo dạng: Thứ - Môn học thêm - Địa điểm/Giờ.

3. Lịch luyện tập và ôn tập do AI phân bố:
- Dựa trên các môn học hiện tại + điểm số + những môn người dùng có điểm thấp (< 6.5).
- Ưu tiên tăng thời gian ôn cho môn điểm thấp.
- Phân bổ thời gian hợp lý trong ngày, bảo đảm không trùng giờ học trên trường và học thêm.

Yêu cầu:
- Thời gian nghỉ giữa các buổi ít nhất 10 - 20 phút.
- Văn phong ngắn gọn, rõ ràng, dễ hiểu.
- Hiển thị theo bảng gọn gàng.
- Nếu người dùng ít thời gian rảnh thì AI chỉ chọn những bài tập trọng tâm nhất.
- Nếu hôm đó người dùng rảnh nhiều, AI có thể thêm phần "Ôn lại bài cũ + Bài tập mở rộng".

Khi tạo lịch mới, AI chỉ cần xuất kết quả theo định dạng:

=== LỊCH HỌC TRONG NGÀY ===
[LỊCH HỌC TRÊN TRƯỜNG]
...

[LỊCH HỌC THÊM]
...

[LỊCH LUYỆN TẬP DO AI PHÂN BỐ]
...

Không giải thích dài dòng.
Chỉ trả ra kết quả final.`;

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
