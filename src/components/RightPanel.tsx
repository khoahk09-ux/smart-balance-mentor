import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const RightPanel = () => {
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const loadSchedule = async () => {
      if (!user) return;

      // Load user's weekly schedule
      const { data: weeklySchedule } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user.id)
        .eq("schedule_type", "weekly");

      // Get today's day of week
      const dayOfWeek = currentDate.getDay();
      const daysOfWeek = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      
      const combinedSchedule: any[] = [];

      // Add user's schedule for today
      if (weeklySchedule && weeklySchedule[0]?.schedule_data) {
        const todayClasses = weeklySchedule[0].schedule_data[dayOfWeek] || [];
        todayClasses.forEach((item: any) => {
          combinedSchedule.push({
            date: `Hôm nay - ${daysOfWeek[dayOfWeek]}`,
            title: item.subject || item.title,
            subject: item.subject,
            time: item.time || "Chưa xác định",
            type: "user_schedule"
          });
        });
      }

      // Add AI-suggested study sessions (mock data - can be replaced with AI generation)
      const { data: lowScoreSubjects } = await supabase
        .from("user_scores")
        .select("*")
        .eq("user_id", user.id);

      if (lowScoreSubjects) {
        lowScoreSubjects.forEach((subject: any) => {
          const scoreValues = Object.values(subject.scores || {}).filter((v): v is number => typeof v === 'number');
          const avg = scoreValues.length > 0 
            ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length 
            : 0;
          
          if (avg < 6) {
            combinedSchedule.push({
              date: "AI đề xuất",
              title: `Ôn tập ${subject.subject}`,
              subject: subject.subject,
              time: "30-60 phút",
              type: "ai_suggested"
            });
          }
        });
      }

      setScheduleData(combinedSchedule);
    };

    loadSchedule();
  }, [user]);

  // Generate calendar days
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const today = currentDate.getDate();

  return (
    <div className="w-80 h-screen bg-card border-l border-border/50 overflow-y-auto sticky top-0">
      <div className="p-6 space-y-6">
        {/* Calendar */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button className="p-1 hover:bg-muted rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="font-semibold text-sm">{monthName}</h3>
            <button className="p-1 hover:bg-muted rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
              <div key={day} className="text-muted-foreground font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today;
              return (
                <button
                  key={day}
                  className={`aspect-square flex items-center justify-center text-xs rounded-lg transition-colors ${
                    isToday
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </Card>

        {/* My Schedule */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Lịch của tôi</h3>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {scheduleData.length > 0 ? (
              scheduleData.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    item.type === 'ai_suggested' 
                      ? 'bg-accent/10 border border-accent/30 hover:bg-accent/20' 
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 px-2 py-1 rounded inline-flex items-center gap-1 ${
                    item.type === 'ai_suggested'
                      ? 'text-accent bg-accent/10'
                      : 'text-primary bg-primary/10'
                  }`}>
                    {item.type === 'ai_suggested' && <BookOpen className="w-3 h-3" />}
                    {item.date}
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.subject}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chưa có lịch học</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RightPanel;
