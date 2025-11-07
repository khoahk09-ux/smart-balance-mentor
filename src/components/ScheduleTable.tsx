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
import TodayReviewSchedule from "./TodayReviewSchedule";
import ReviewBadges from "./ReviewBadges";

const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
const TIME_SLOTS = [
  "6:00 - 7:00", "7:00 - 8:00", "8:00 - 9:00", "9:00 - 10:00", "10:00 - 11:00",
  "11:00 - 12:00", "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
  "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00", "20:00 - 21:00", "21:00 - 22:00"
];

const MORNING_PERIODS = ["Tiết 1", "Tiết 2", "Tiết 3", "Tiết 4", "Tiết 5"];
const AFTERNOON_PERIODS = ["Tiết 6", "Tiết 7", "Tiết 8", "Tiết 9", "Tiết 10"];
const SESSIONS = ["Buổi sáng", "Buổi chiều"];

interface ExtraClass {
  day: string;
  session: string;
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

  const handleSchoolCellChange = (day: string, period: string, value: string) => {
    const updated = {
      ...schoolSchedule,
      [day]: {
        ...(schoolSchedule[day] || {}),
        [period]: value
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

  const handleExtraClassChange = (day: string, session: string, index: number, field: 'subject' | 'time', value: string) => {
    const classesInSlot = extraSchedule.filter(ec => ec.day === day && ec.session === session);
    if (index < classesInSlot.length) {
      const targetClass = classesInSlot[index];
      const globalIndex = extraSchedule.findIndex(ec => ec === targetClass);
      const updated = [...extraSchedule];
      updated[globalIndex] = { ...updated[globalIndex], [field]: value };
      setExtraSchedule(updated);
    }
  };

  const addExtraClassToSlot = (day: string, session: string) => {
    const newClass: ExtraClass = {
      day,
      session,
      time: '',
      subject: ''
    };
    setExtraSchedule([...extraSchedule, newClass]);
  };

  const removeExtraClassFromSlot = (day: string, session: string, index: number) => {
    const classesInSlot = extraSchedule.filter(ec => ec.day === day && ec.session === session);
    if (index < classesInSlot.length) {
      const targetClass = classesInSlot[index];
      setExtraSchedule(extraSchedule.filter(ec => ec !== targetClass));
    }
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
      
      // Tìm các môn học thêm trong ngày (chỉ những môn có đủ subject và time)
      const dayExtraClasses = extraSchedule.filter(
        ec => ec.day === day && ec.subject && ec.time
      );
      
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
      <Tabs defaultValue="school" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="school">📚 Lịch Trường</TabsTrigger>
          <TabsTrigger value="extra">⏰ Học Thêm</TabsTrigger>
          <TabsTrigger value="ai">🤖 Lịch AI</TabsTrigger>
        </TabsList>

        {/* Phần 1: Lịch học trên trường */}
        <TabsContent value="school" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  Thời khóa biểu trên trường
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Nhập lịch học chính thức của bạn theo tiết
                </p>
              </div>
              <Button onClick={handleSaveSchoolSchedule}>
                <Save className="w-4 h-4 mr-2" />
                Lưu lịch trường
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold bg-muted/50">Tiết / Thứ</th>
                    {DAYS.map(day => (
                      <th key={day} className="p-3 text-center font-semibold bg-muted/50 min-w-[120px]">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...MORNING_PERIODS, ...AFTERNOON_PERIODS].map((period, idx) => (
                    <tr key={period} className={`border-b hover:bg-muted/20 ${idx === 5 ? 'border-t-2 border-primary/20' : ''}`}>
                      <td className="p-3 font-medium text-muted-foreground">
                        {period}
                      </td>
                      {DAYS.map(day => (
                        <td key={`${day}-${period}`} className="p-2">
                          <Input
                            value={schoolSchedule[day]?.[period] || ""}
                            onChange={(e) => handleSchoolCellChange(day, period, e.target.value)}
                            placeholder="Môn học"
                            className="text-center border-dashed"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Phần 2: Lịch học thêm */}
        <TabsContent value="extra" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  Lịch học thêm
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Thêm các lớp học thêm với thời gian và địa điểm cụ thể
                </p>
              </div>
              <Button onClick={handleSaveExtraSchedule}>
                <Save className="w-4 h-4 mr-2" />
                Lưu lịch học thêm
              </Button>
            </div>

            <div className="grid gap-4">
              {DAYS.map(day => (
                <Card key={day} className="p-4 border-l-4 border-l-primary/50">
                  <h3 className="font-semibold text-lg mb-3">{day}</h3>
                  <div className="space-y-3">
                    {SESSIONS.map((session) => {
                      const classesInSlot = extraSchedule.filter(
                        ec => ec.day === day && ec.session === session
                      );
                      
                      return (
                        <div key={session} className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">{session}</div>
                          {classesInSlot.map((extraClass, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-muted/30 p-3 rounded-lg">
                              <Input
                                placeholder="Môn học"
                                value={extraClass.subject}
                                onChange={(e) => handleExtraClassChange(day, session, idx, 'subject', e.target.value)}
                                className="flex-1"
                              />
                              <Select
                                value={extraClass.time}
                                onValueChange={(value) => handleExtraClassChange(day, session, idx, 'time', value)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Chọn giờ" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_SLOTS.map(slot => (
                                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => removeExtraClassFromSlot(day, session, idx)}
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addExtraClassToSlot(day, session)}
                            className="w-full"
                          >
                            + Thêm lớp {session.toLowerCase()}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Phần 3: Lịch AI phân bố */}
        <TabsContent value="ai" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Brain className="w-6 h-6" />
                  Lịch luyện tập & ôn tập do AI phân bố
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  AI tự động tạo lịch học dựa trên lịch trường và học thêm của bạn
                </p>
              </div>
              <Button onClick={generateAISchedule} variant="default">
                <Sparkles className="w-4 h-4 mr-2" />
                Tạo lịch AI
              </Button>
            </div>

            <div className="space-y-4">
              {DAYS.map(day => {
                const daySchedule = aiSchedule[day] || [];
                if (daySchedule.length === 0) return null;

                return (
                  <Card key={day} className="p-4 border-l-4 border-l-emerald-500/50">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {day}
                    </h3>
                    <div className="space-y-2">
                      {daySchedule.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            item.type === 'study' ? 'bg-blue-500/10 border border-blue-500/20' :
                            item.type === 'homework' ? 'bg-purple-500/10 border border-purple-500/20' :
                            'bg-emerald-500/10 border border-emerald-500/20'
                          }`}
                        >
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium min-w-[120px]">{item.time}</span>
                          <span className="flex-1">{item.activity}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
              
              {Object.keys(aiSchedule).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có lịch AI. Hãy thêm lịch học thêm và nhấn "Tạo lịch AI"</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Phần ôn tập theo chu kỳ */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
        <h2 className="text-xl font-bold mb-4">📝 Ôn tập theo chu kỳ</h2>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">Ôn Hôm Nay</TabsTrigger>
            <TabsTrigger value="badges">Huy Hiệu</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="mt-6">
            <TodayReviewSchedule />
          </TabsContent>
          
          <TabsContent value="badges" className="mt-6">
            <ReviewBadges />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default ScheduleTable;
