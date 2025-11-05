import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Save, Clock, BookOpen, Brain, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const TIME_SLOTS = [
  "6:00 - 7:00", "7:00 - 8:00", "8:00 - 9:00", "9:00 - 10:00", "10:00 - 11:00",
  "11:00 - 12:00", "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
  "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00", "20:00 - 21:00", "21:00 - 22:00"
];

const SESSIONS = ["Buổi sáng", "Buổi chiều"];

interface ExtraClass {
  day: string;
  time: string;
  subject: string;
}

const ScheduleTable = () => {
  const { user } = useAuth();
  const [schoolSchedule, setSchoolSchedule] = useState<Record<string, Record<string, string>>>({});
  const [extraSchedule, setExtraSchedule] = useState<ExtraClass[]>([]);
  const [aiSchedule, setAiSchedule] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState("school");

  useEffect(() => {
    if (user) {
      loadSchedules();
    }
  }, [user]);

  useEffect(() => {
    if (extraSchedule.length > 0) {
      generateAISchedule();
    }
  }, [extraSchedule]);

  const loadSchedules = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error loading schedules:", error);
      return;
    }

    data?.forEach(schedule => {
      if (schedule.schedule_type === "school") {
        setSchoolSchedule(schedule.schedule_data as unknown as Record<string, Record<string, string>>);
      } else if (schedule.schedule_type === "extra") {
        setExtraSchedule(schedule.schedule_data as unknown as ExtraClass[]);
      }
    });
  };

  const saveSchedule = async (type: string, data: any) => {
    if (!user) return;

    const { data: existing } = await supabase
      .from("schedules")
      .select("id")
      .eq("user_id", user.id)
      .eq("schedule_type", type)
      .single();

    if (existing) {
      await supabase
        .from("schedules")
        .update({ schedule_data: data })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("schedules")
        .insert({ user_id: user.id, schedule_type: type, schedule_data: data });
    }
  };

  const handleSchoolCellChange = (day: string, session: string, value: string) => {
    const updated = {
      ...schoolSchedule,
      [day]: {
        ...(schoolSchedule[day] || {}),
        [session]: value
      }
    };
    setSchoolSchedule(updated);
  };

  const handleSaveSchoolSchedule = async () => {
    await saveSchedule("school", schoolSchedule);
    toast.success("Đã lưu thời khóa biểu trường!", {
      description: "Lịch học trên trường của bạn đã được lưu"
    });
  };

  const addExtraClass = () => {
    setExtraSchedule([...extraSchedule, { day: DAYS[0], time: TIME_SLOTS[0], subject: "" }]);
  };

  const updateExtraClass = (index: number, field: keyof ExtraClass, value: string) => {
    const updated = [...extraSchedule];
    updated[index] = { ...updated[index], [field]: value };
    setExtraSchedule(updated);
  };

  const removeExtraClass = (index: number) => {
    setExtraSchedule(extraSchedule.filter((_, i) => i !== index));
  };

  const handleSaveExtraSchedule = async () => {
    await saveSchedule("extra", extraSchedule);
    toast.success("Đã lưu lịch học thêm!", {
      description: "Lịch học thêm đã được lưu và AI sẽ tối ưu thời gian học"
    });
  };

  const generateAISchedule = () => {
    const schedule: Record<string, any[]> = {};
    
    DAYS.forEach(day => {
      schedule[day] = [];
      
      // Tìm các môn học thêm trong ngày
      const dayExtraClasses = extraSchedule.filter(ec => ec.day === day);
      
      dayExtraClasses.forEach(extraClass => {
        const timeSlot = TIME_SLOTS.indexOf(extraClass.time);
        
        // Thời gian học
        schedule[day].push({
          time: extraClass.time,
          activity: `📚 Học ${extraClass.subject}`,
          type: "study"
        });
        
        // Sau mỗi giờ học, thêm thời gian làm bài tập (1 tiếng sau)
        if (timeSlot + 1 < TIME_SLOTS.length) {
          schedule[day].push({
            time: TIME_SLOTS[timeSlot + 1],
            activity: `✍️ Làm bài tập ${extraClass.subject}`,
            type: "homework"
          });
        }
        
        // Thời gian ôn tập (2 tiếng sau khi học)
        if (timeSlot + 2 < TIME_SLOTS.length) {
          schedule[day].push({
            time: TIME_SLOTS[timeSlot + 2],
            activity: `📖 Ôn lại ${extraClass.subject}`,
            type: "review"
          });
        }
      });
      
      // Sắp xếp theo thời gian
      schedule[day].sort((a, b) => 
        TIME_SLOTS.indexOf(a.time) - TIME_SLOTS.indexOf(b.time)
      );
    });
    
    setAiSchedule(schedule);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Quản lý thời khóa biểu
            </h2>
            <p className="text-sm text-muted-foreground">
              3 loại lịch học thông minh để quản lý thời gian hiệu quả
            </p>
          </div>
          <Calendar className="w-10 h-10 text-primary" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="school" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Lịch trường
            </TabsTrigger>
            <TabsTrigger value="extra" className="gap-2">
              <Clock className="w-4 h-4" />
              Học thêm
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Brain className="w-4 h-4" />
              AI tối ưu
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: School Schedule */}
          <TabsContent value="school" className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Thời khóa biểu học trên trường
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Nhập các môn học theo buổi (sáng/chiều) - không cần thời gian cụ thể
                  </p>
                </div>
              </div>
            </Card>

            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-8 gap-2">
                  <div className="font-semibold text-center p-3 bg-primary/10 rounded-lg">
                    Buổi
                  </div>
                  {DAYS.map(day => (
                    <div key={day} className="font-semibold text-center p-3 bg-primary/10 rounded-lg text-sm">
                      {day}
                    </div>
                  ))}

                  {SESSIONS.map(session => (
                    <>
                      <div key={`session-${session}`} className="text-sm font-medium p-3 bg-muted/30 rounded-lg flex items-center justify-center">
                        {session}
                      </div>
                      {DAYS.map(day => (
                        <div key={`${day}-${session}`} className="p-1">
                          <Input
                            value={schoolSchedule[day]?.[session] || ""}
                            onChange={(e) => handleSchoolCellChange(day, session, e.target.value)}
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

            <div className="flex justify-end">
              <Button onClick={handleSaveSchoolSchedule} className="gap-2">
                <Save className="w-4 h-4" />
                Lưu lịch trường
              </Button>
            </div>
          </TabsContent>

          {/* Tab 2: Extra Classes Schedule */}
          <TabsContent value="extra" className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    Lịch học thêm
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Thêm các môn học thêm với thời gian cụ thể để AI có thể phân bổ thời gian hợp lý
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {extraSchedule.map((extraClass, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Select
                      value={extraClass.day}
                      onValueChange={(value) => updateExtraClass(index, "day", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thứ" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map(day => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={extraClass.time}
                      onValueChange={(value) => updateExtraClass(index, "time", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giờ" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      value={extraClass.subject}
                      onChange={(e) => updateExtraClass(index, "subject", e.target.value)}
                      placeholder="Tên môn học..."
                      className="md:col-span-1"
                    />

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeExtraClass(index)}
                    >
                      Xóa
                    </Button>
                  </div>
                </Card>
              ))}

              <Button onClick={addExtraClass} variant="outline" className="w-full">
                + Thêm môn học thêm
              </Button>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveExtraSchedule} className="gap-2">
                <Save className="w-4 h-4" />
                Lưu lịch học thêm
              </Button>
            </div>
          </TabsContent>

          {/* Tab 3: AI Optimized Schedule */}
          <TabsContent value="ai" className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                    Lịch học được AI tối ưu hóa
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    AI tự động phân bổ thời gian học, làm bài tập và ôn tập dựa trên lịch học thêm
                  </p>
                </div>
              </div>
            </Card>

            {extraSchedule.length === 0 ? (
              <Card className="p-8 text-center">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Vui lòng thêm các môn học thêm để AI có thể tạo lịch học tối ưu
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {DAYS.map(day => (
                  aiSchedule[day] && aiSchedule[day].length > 0 && (
                    <Card key={day} className="p-4">
                      <h3 className="font-semibold mb-3 text-lg">{day}</h3>
                      <div className="space-y-2">
                        {aiSchedule[day].map((item, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg flex items-center justify-between ${
                              item.type === "study"
                                ? "bg-blue-500/10 border border-blue-500/20"
                                : item.type === "homework"
                                ? "bg-purple-500/10 border border-purple-500/20"
                                : "bg-emerald-500/10 border border-emerald-500/20"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-medium text-muted-foreground">
                                {item.time}
                              </span>
                              <span className="font-medium">{item.activity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <h3 className="font-semibold mb-2">📚 Lịch trường</h3>
          <p className="text-sm text-muted-foreground">
            Quản lý lịch học chính thức trên trường theo buổi
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <h3 className="font-semibold mb-2">⏰ Học thêm</h3>
          <p className="text-sm text-muted-foreground">
            Thêm các lớp học thêm với thời gian cụ thể
          </p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <h3 className="font-semibold mb-2">🤖 AI tối ưu</h3>
          <p className="text-sm text-muted-foreground">
            AI tự động phân bổ thời gian học tập hiệu quả
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ScheduleTable;
