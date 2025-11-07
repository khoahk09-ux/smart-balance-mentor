import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, CheckCircle2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import MathRenderer from "./MathRenderer";
import { useLanguage } from "@/contexts/LanguageContext";

const SUBJECTS = [
  "Toán", "Vật lý", "Hóa học", "Văn", "Anh văn",
  "Sinh học", "Lịch sử", "Địa lý", "GDCD"
];

interface Mistake {
  id: string;
  question_text: string;
  question_type: string;
  user_answer: string | null;
  correct_answer: string;
  explanation: string;
  subject: string;
  grade: string;
  is_reviewed: boolean;
  created_at: string;
}

const MistakeReview = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "unreviewed" | "reviewed">("all");

  useEffect(() => {
    loadMistakes();
  }, [filterSubject, filterStatus]);

  const loadMistakes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('quiz_mistakes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filterSubject !== "all") {
        query = query.eq('subject', filterSubject);
      }

      if (filterStatus === "unreviewed") {
        query = query.eq('is_reviewed', false);
      } else if (filterStatus === "reviewed") {
        query = query.eq('is_reviewed', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMistakes(data || []);
    } catch (error) {
      console.error("Error loading mistakes:", error);
      toast.error("Không thể tải dữ liệu câu sai");
    } finally {
      setLoading(false);
    }
  };

  const markAsReviewed = async (id: string) => {
    const { error } = await supabase
      .from('quiz_mistakes')
      .update({ is_reviewed: true, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error("Error marking as reviewed:", error);
      toast.error("Không thể cập nhật trạng thái");
      return;
    }

    toast.success("Đã đánh dấu là đã ôn");
    loadMistakes();
  };

  const deleteMistake = async (id: string) => {
    const { error } = await supabase
      .from('quiz_mistakes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting mistake:", error);
      toast.error("Không thể xóa");
      return;
    }

    toast.success("Đã xóa câu hỏi");
    loadMistakes();
  };

  const resetAllReviewed = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('quiz_mistakes')
      .update({ is_reviewed: false, reviewed_at: null })
      .eq('user_id', user.id)
      .eq('is_reviewed', true);

    if (error) {
      console.error("Error resetting:", error);
      toast.error("Không thể đặt lại");
      return;
    }

    toast.success("Đã đặt lại tất cả câu đã ôn");
    loadMistakes();
  };

  const unreviewedCount = mistakes.filter(m => !m.is_reviewed).length;
  const reviewedCount = mistakes.filter(m => m.is_reviewed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Ôn Tập Câu Sai</h2>
              <p className="text-sm text-muted-foreground">
                Xem lại và ôn tập các câu đã làm sai
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="destructive" className="px-3 py-1">
              Chưa ôn: {unreviewedCount}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              Đã ôn: {reviewedCount}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Lọc theo môn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả môn học</SelectItem>
              {SUBJECTS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)} className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="unreviewed">Chưa ôn</TabsTrigger>
              <TabsTrigger value="reviewed">Đã ôn</TabsTrigger>
            </TabsList>
          </Tabs>

          {reviewedCount > 0 && (
            <Button onClick={resetAllReviewed} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Đặt lại đã ôn
            </Button>
          )}
        </div>
      </Card>

      {mistakes.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {filterStatus === "unreviewed" ? "Không có câu nào cần ôn!" : "Không có câu sai nào"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filterStatus === "unreviewed" 
                ? "Bạn đã ôn hết các câu sai rồi. Tuyệt vời!" 
                : "Hãy làm bài kiểm tra để hệ thống ghi nhận câu sai và giúp bạn ôn tập"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {mistakes.map((mistake) => (
            <Card 
              key={mistake.id} 
              className={`p-5 transition-all ${mistake.is_reviewed ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {mistake.subject} - Khối {mistake.grade}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {mistake.question_type === "multiple_choice" && "Trắc nghiệm"}
                      {mistake.question_type === "true_false" && "Đúng/Sai"}
                      {mistake.question_type === "short_answer" && "Trả lời ngắn"}
                    </Badge>
                    {mistake.is_reviewed && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã ôn
                      </Badge>
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="font-semibold mb-2">Câu hỏi:</p>
                    <MathRenderer content={mistake.question_text} className="text-base" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm font-medium text-destructive mb-1">Câu trả lời của bạn:</p>
                      <MathRenderer 
                        content={mistake.user_answer || "(Không trả lời)"} 
                        className="text-sm"
                      />
                    </div>
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-sm font-medium text-success mb-1">Đáp án đúng:</p>
                      <MathRenderer content={mistake.correct_answer} className="text-sm" />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm font-medium mb-1">Giải thích:</p>
                    <MathRenderer content={mistake.explanation} className="text-sm text-muted-foreground" />
                  </div>

                  <div className="flex gap-2 mt-4">
                    {!mistake.is_reviewed && (
                      <Button 
                        onClick={() => markAsReviewed(mistake.id)}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Đánh dấu đã ôn
                      </Button>
                    )}
                    <Button 
                      onClick={() => deleteMistake(mistake.id)}
                      size="sm"
                      variant="ghost"
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Ngày làm: {new Date(mistake.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MistakeReview;