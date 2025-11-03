import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Save } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const TIME_SLOTS = [
  "6:00 - 7:00",
  "7:00 - 8:00",
  "8:00 - 9:00",
  "9:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00",
  "18:00 - 19:00",
  "19:00 - 20:00",
  "20:00 - 21:00",
  "21:00 - 22:00"
];

const ScheduleTable = () => {
  const [schedule, setSchedule] = useState<Record<string, Record<string, string>>>({});

  const handleCellChange = (day: string, time: string, value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [time]: value
      }
    }));
  };

  const handleSave = () => {
    toast.success("Đã lưu thời khóa biểu!", {
      description: "AI sẽ nhắc nhở bạn học đúng giờ đã đặt"
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Thời khóa biểu</h2>
            <p className="text-sm text-muted-foreground">
              Điền lịch học để AI quản lý thời gian và nhắc nhở bạn
            </p>
          </div>
          <Calendar className="w-8 h-8 text-primary" />
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 gap-2">
              {/* Header */}
              <div className="font-semibold text-center p-3 bg-primary/10 rounded-lg">
                Khung giờ
              </div>
              {DAYS.map(day => (
                <div key={day} className="font-semibold text-center p-3 bg-primary/10 rounded-lg">
                  {day}
                </div>
              ))}

              {/* Time Slots */}
              {TIME_SLOTS.map(time => (
                <>
                  <div key={`time-${time}`} className="text-sm font-medium p-3 bg-muted/30 rounded-lg flex items-center justify-center">
                    {time}
                  </div>
                  {DAYS.map(day => (
                    <div key={`${day}-${time}`} className="p-1">
                      <Input
                        value={schedule[day]?.[time] || ""}
                        onChange={(e) => handleCellChange(day, time, e.target.value)}
                        placeholder="Môn học..."
                        className="h-12 text-center text-sm"
                      />
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} size="lg" className="gap-2">
            <Save className="w-4 h-4" />
            Lưu thời khóa biểu
          </Button>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <h3 className="font-semibold mb-2">🔔 Nhắc nhở thông minh</h3>
          <p className="text-sm text-muted-foreground">
            AI sẽ tự động nhắc bạn học đúng giờ đã đặt trong thời khóa biểu
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <h3 className="font-semibold mb-2">⚡ Tối ưu tự động</h3>
          <p className="text-sm text-muted-foreground">
            AI sẽ chủ động đề xuất điều chỉnh lịch dựa trên môn yếu của bạn
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ScheduleTable;
