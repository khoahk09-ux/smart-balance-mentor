import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import MathRenderer from "./MathRenderer";

interface Mistake {
  id: string;
  question_text: string;
  subject: string;
  grade: string;
  error_type?: string;
  chapter?: string;
}

interface PracticeQuestion {
  question_text: string;
  correct_answer: string;
  explanation: string;
  difficulty_level: string;
}

interface Props {
  mistake: Mistake;
  mistakeHistory: Mistake[];
}

const PracticeQuizGenerator = ({ mistake, mistakeHistory }: Props) => {
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const generatePractice = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mistake-analysis', {
        body: {
          action: 'generate_practice',
          mistake: mistake,
          mistakeHistory: mistakeHistory.slice(0, 10) // Send last 10 mistakes
        }
      });

      if (error) throw error;

      if (data?.result && Array.isArray(data.result)) {
        setQuestions(data.result);
        setUserAnswers({});
        setSubmitted({});
        toast.success("Đã tạo 5 câu hỏi luyện tập!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating practice:", error);
      toast.error("Không thể tạo bài luyện tập");
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = (index: number) => {
    const userAnswer = userAnswers[index]?.trim().toLowerCase();
    const correctAnswer = questions[index].correct_answer.trim().toLowerCase();
    
    setSubmitted({ ...submitted, [index]: true });

    if (userAnswer === correctAnswer) {
      toast.success("Chính xác! Bạn đã làm đúng");
    } else {
      toast.error("Chưa đúng, hãy xem lại giải thích");
    }
  };

  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Bài luyện tập tương tự</h3>
        </div>
        <Button
          onClick={generatePractice}
          disabled={loading}
          size="sm"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tạo...
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              Tạo 5 câu luyện tập
            </>
          )}
        </Button>
      </div>

      {questions.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">
          Nhấn nút "Tạo 5 câu luyện tập" để hệ thống AI tạo các câu hỏi tương tự giúp bạn rèn luyện
        </p>
      )}

      {questions.length > 0 && (
        <div className="space-y-4 mt-4">
          {questions.map((q, index) => (
            <Card key={index} className="p-4 border-2">
              <div className="flex items-start justify-between mb-2">
                <span className="font-semibold text-sm">Câu {index + 1}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {q.difficulty_level === 'easy' && 'Dễ'}
                  {q.difficulty_level === 'medium' && 'Trung bình'}
                  {q.difficulty_level === 'hard' && 'Khó'}
                </span>
              </div>

              <MathRenderer content={q.question_text} className="mb-3 text-base" />

              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Nhập câu trả lời của bạn"
                  value={userAnswers[index] || ''}
                  onChange={(e) => setUserAnswers({ ...userAnswers, [index]: e.target.value })}
                  disabled={submitted[index]}
                  className="flex-1"
                />
                <Button
                  onClick={() => checkAnswer(index)}
                  disabled={!userAnswers[index] || submitted[index]}
                  size="sm"
                >
                  Kiểm tra
                </Button>
              </div>

              {submitted[index] && (
                <div className="space-y-2">
                  <div className={`p-3 rounded-lg flex items-start gap-2 ${
                    userAnswers[index]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
                      ? 'bg-success/10 border border-success/20'
                      : 'bg-destructive/10 border border-destructive/20'
                  }`}>
                    {userAnswers[index]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase() ? (
                      <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Đáp án đúng:</p>
                      <MathRenderer content={q.correct_answer} className="text-sm" />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm font-medium mb-1">Giải thích:</p>
                    <MathRenderer content={q.explanation} className="text-sm text-muted-foreground" />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};

export default PracticeQuizGenerator;
