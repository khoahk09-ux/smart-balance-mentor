import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import MathRenderer from "./MathRenderer";

interface Mistake {
  id: string;
  question_text: string;
  user_answer: string | null;
  correct_answer: string;
  explanation: string;
  subject: string;
  grade: string;
  error_type?: string;
}

interface Props {
  mistake: Mistake;
}

const MistakeAIExplainer = ({ mistake }: Props) => {
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const getExplanation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mistake-analysis', {
        body: {
          action: 'explain',
          mistake: mistake
        }
      });

      if (error) throw error;

      if (data?.result) {
        setExplanation(data.result);
      }
    } catch (error) {
      console.error("Error getting explanation:", error);
      toast.error("Không thể lấy giải thích từ AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-accent/5 border-accent/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" />
          <h3 className="font-semibold">Giải thích chi tiết từ AI</h3>
        </div>
        <Button
          onClick={getExplanation}
          disabled={loading}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang phân tích...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Giải thích bằng AI
            </>
          )}
        </Button>
      </div>

      {explanation && (
        <div className="mt-4 p-4 rounded-lg bg-background border">
          <MathRenderer 
            content={explanation} 
            className="text-sm whitespace-pre-wrap leading-relaxed"
          />
        </div>
      )}

      {!explanation && !loading && (
        <p className="text-sm text-muted-foreground">
          Nhấn nút "Giải thích bằng AI" để nhận phân tích chi tiết về lỗi sai này
        </p>
      )}
    </Card>
  );
};

export default MistakeAIExplainer;
