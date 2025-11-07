import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, mistake, mistakeHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'explain') {
      systemPrompt = `Bạn là trợ lý học tập chuyên nghiệp. Nhiệm vụ của bạn là giải thích lỗi sai cho học sinh một cách dễ hiểu.

Khi phân tích lỗi, hãy tuân thủ format sau:

**1) Lý do sai:**
[Giải thích ngắn gọn tại sao câu trả lời sai, tránh dùng thuật ngữ phức tạp]

**2) Cách làm đúng:**
[Trình bày công thức hoặc phương pháp đúng với ví dụ cụ thể]

**3) Ví dụ tương tự:**
[Đưa ra 1 ví dụ khác tương tự để học sinh hiểu sâu hơn]

**4) Ghi nhớ:**
[Tóm tắt điểm quan trọng trong 1 câu]

Hãy viết bằng tiếng Việt, ngắn gọn, dễ hiểu.`;

      userPrompt = `Học sinh đã làm sai câu hỏi sau:

**Câu hỏi:** ${mistake.question_text}

**Đáp án của học sinh:** ${mistake.user_answer || "(Không trả lời)"}

**Đáp án đúng:** ${mistake.correct_answer}

**Môn học:** ${mistake.subject} - Khối ${mistake.grade}

Hãy giải thích chi tiết theo format đã cho.`;

    } else if (action === 'generate_practice') {
      systemPrompt = `Bạn là hệ thống tạo câu hỏi luyện tập thông minh. Dựa trên lịch sử lỗi sai của học sinh, hãy tạo 5 câu hỏi luyện tập tương tự.

Yêu cầu:
- Tạo đúng 5 câu hỏi
- Các câu hỏi phải cùng dạng bài với câu đã sai
- Thay đổi số liệu và bối cảnh để học sinh không học vẹt
- Ưu tiên các lỗi lặp lại nhiều lần
- Mỗi câu hỏi phải có: question_text, correct_answer, explanation
- Format trả về phải là JSON array hợp lệ

Trả về theo format JSON:
[
  {
    "question_text": "...",
    "correct_answer": "...",
    "explanation": "...",
    "difficulty_level": "easy|medium|hard"
  }
]`;

      const mistakesSummary = mistakeHistory.map((m: any) => 
        `- ${m.subject}: ${m.question_text.substring(0, 100)}... (Sai ${m.times_repeated || 1} lần)`
      ).join('\n');

      userPrompt = `Dựa trên lịch sử lỗi sai sau của học sinh:

${mistakesSummary}

Tập trung vào câu hỏi gần nhất:
**Câu hỏi:** ${mistake.question_text}
**Môn:** ${mistake.subject} - Khối ${mistake.grade}
**Loại lỗi:** ${mistake.error_type || 'chưa xác định'}

Hãy tạo 5 câu hỏi luyện tập để học sinh cải thiện. Trả về JSON array.`;
    } else if (action === 'classify_error') {
      systemPrompt = `Bạn là hệ thống phân loại lỗi sai thông minh. Hãy phân tích lỗi sai và xác định:
1. Loại lỗi (formula/data/theory/calculation)
2. Chương học liên quan

Trả về JSON object:
{
  "error_type": "formula|data|theory|calculation",
  "chapter": "tên chương",
  "analysis": "phân tích ngắn gọn"
}`;

      userPrompt = `Phân tích lỗi sai sau:

**Câu hỏi:** ${mistake.question_text}
**Đáp án sai:** ${mistake.user_answer || "(Không trả lời)"}
**Đáp án đúng:** ${mistake.correct_answer}
**Môn:** ${mistake.subject}

Xác định loại lỗi:
- "formula": Sai công thức, định lý
- "data": Nhầm lẫn số liệu, đơn vị
- "theory": Hiểu sai khái niệm, lý thuyết
- "calculation": Sai khi tính toán, cẩu thả

Trả về JSON.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let result;
    if (action === 'generate_practice' || action === 'classify_error') {
      try {
        result = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse JSON:', content);
        result = { error: 'Failed to parse AI response', raw: content };
      }
    } else {
      result = content;
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in mistake-analysis:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
