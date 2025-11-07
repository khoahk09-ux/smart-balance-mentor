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
