import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const RightPanel = () => {
  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  
  // Mock schedule data
  const upcomingSchedule = [
    {
      date: "15 Tháng 10, 2027",
      title: "Kiểm tra Toán",
      subject: "Toán học",
      time: "9:00 AM - 10:30 AM"
    },
    {
      date: "1 Tháng 11, 2027",
      title: "Thuyết trình Văn",
      subject: "Ngữ văn",
      time: "2:00 PM - 4:00 PM"
    },
    {
      date: "20 Tháng 11, 2027",
      title: "Bài kiểm tra Lý",
      subject: "Vật lý",
      time: "11:00 AM - 12:30 PM"
    }
  ];

  // Generate calendar days
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const today = currentDate.getDate();

  return (
    <div className="w-80 h-screen bg-card border-l border-border/50 overflow-y-auto sticky top-0">
      <div className="p-6 space-y-6">
        {/* Performance Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Hiệu suất</h3>
            <button className="text-muted-foreground hover:text-foreground">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
              </svg>
            </button>
          </div>
          
          {/* Circular Progress */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="hsl(var(--primary))"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56 * 0.75} ${2 * Math.PI * 56}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">1.274</span>
              <span className="text-xs text-muted-foreground">Điểm tổng</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-1 text-sm">
            <span className="text-warning">🏆</span>
            <span className="text-muted-foreground">4th trong bảng xếp hạng</span>
          </div>
        </Card>

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
            {upcomingSchedule.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="text-xs text-primary font-medium mb-1 bg-primary/10 px-2 py-1 rounded inline-block">
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
                <button className="text-xs text-primary hover:underline mt-2">
                  →
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activities */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Hoạt động gần đây</h3>
            <button className="text-muted-foreground hover:text-foreground">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-semibold mb-2">Hôm nay</div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Hoàn thành bài kiểm tra Toán</p>
                <p>Cập nhật lịch học tuần</p>
                <p>Đạt mục tiêu học tập hàng ngày</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RightPanel;
