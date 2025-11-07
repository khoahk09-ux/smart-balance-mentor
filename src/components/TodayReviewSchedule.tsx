import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, TrendingUp, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import MathRenderer from "./MathRenderer";

interface ReviewItem {
  id: string;
  mistake_id: string;
  review_round: number;
  scheduled_date: string;
  completed: boolean;
  mistake: {
    question_text: string;
    subject: string;
    chapter: string;
    correct_answer: string;
    explanation: string;
  };
}

interface GroupedReviews {
  [key: string]: ReviewItem[];
}

const ROUND_LABELS = {
  1: "Lần 1 - Sau 1 ngày (Tránh quên ngay)",
  2: "Lần 2 - Sau 3 ngày (Củng cố lại)",
  3: "Lần 3 - Sau 7 ngày (Ghim vào trí nhớ dài hạn)",
  4: "Lần 4 - Sau 14 ngày (Ổn định lâu dài)"
};

const TodayReviewSchedule = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    loadTodayReviews();
  }, [user]);

  const loadTodayReviews = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's review schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('mistake_review_schedule')
        .select(`
          id,
          mistake_id,
          review_round,
          scheduled_date,
          completed,
          quiz_mistakes:mistake_id (
            question_text,
            subject,
            chapter,
            correct_answer,
            explanation
          )
        `)
        .eq('user_id', user.id)
        .eq('scheduled_date', today)
        .order('review_round', { ascending: true });

      if (scheduleError) throw scheduleError;

      const formattedData = (scheduleData || []).map(item => ({
        id: item.id,
        mistake_id: item.mistake_id,
        review_round: item.review_round,
        scheduled_date: item.scheduled_date,
        completed: item.completed,
        mistake: Array.isArray(item.quiz_mistakes) 
          ? item.quiz_mistakes[0] 
          : item.quiz_mistakes
      })).filter(item => item.mistake);

      setReviews(formattedData);

      // Get today's completion stats
      const { data: statsData } = await supabase
        .from('daily_review_stats')
        .select('mistakes_fixed')
        .eq('user_id', user.id)
        .eq('review_date', today)
        .single();

      setCompletedToday(statsData?.mistakes_fixed || 0);

    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("Không thể tải lịch ôn hôm nay");
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('mistake_review_schedule')
        .update({ 
          completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast.success("✅ Đã hoàn thành ôn tập!");
      loadTodayReviews();
    } catch (error) {
      console.error("Error marking as completed:", error);
      toast.error("Không thể cập nhật");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingReviews = reviews.filter(r => !r.completed);
  const groupedBySubject: GroupedReviews = pendingReviews.reduce((acc, review) => {
    const key = `${review.mistake.subject} - ${review.mistake.chapter || 'Chưa phân loại'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(review);
    return acc;
  }, {} as GroupedReviews);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Lịch Ôn Hôm Nay</h2>
              <p className="text-sm text-muted-foreground">
                Ôn tập theo chu kỳ khoa học
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {pendingReviews.length}
            </div>
            <div className="text-sm text-muted-foreground">câu cần ôn</div>
          </div>
        </div>

        {completedToday > 0 && (
          <div className="mb-4 p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-success" />
            <div>
              <p className="font-semibold text-success">
                Đã hoàn thành {completedToday} câu hôm nay!
              </p>
              <p className="text-sm text-muted-foreground">
                Tiếp tục phát huy nhé! 💪
              </p>
            </div>
          </div>
        )}

        {pendingReviews.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Tuyệt vời! Bạn đã hoàn thành hết!
            </h3>
            <p className="text-sm text-muted-foreground">
              Không có câu nào cần ôn hôm nay
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-background/80 backdrop-blur border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tổng quan hôm nay
              </h3>
              <div className="space-y-2">
                {Object.entries(groupedBySubject).map(([subject, items]) => (
                  <div key={subject} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{subject}</span>
                    <Badge variant="outline">{items.length} câu</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <Card key={review.id} className="p-4 border-2">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {review.mistake.subject}
                        </Badge>
                        {review.mistake.chapter && (
                          <Badge variant="secondary" className="text-xs">
                            {review.mistake.chapter}
                          </Badge>
                        )}
                        <Badge className="text-xs bg-primary/20 text-primary">
                          {ROUND_LABELS[review.review_round as keyof typeof ROUND_LABELS]}
                        </Badge>
                      </div>
                      
                      <MathRenderer 
                        content={review.mistake.question_text} 
                        className="mb-3 text-base"
                      />

                      <div className="grid grid-cols-1 gap-2">
                        <div className="p-2 rounded bg-success/10 border border-success/20">
                          <p className="text-xs font-medium text-success mb-1">Đáp án đúng:</p>
                          <MathRenderer 
                            content={review.mistake.correct_answer} 
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => markAsCompleted(review.id)}
                      size="sm"
                      className="gap-2 flex-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Đã ôn xong
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TodayReviewSchedule;
