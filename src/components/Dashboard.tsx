import { Card } from "@/components/ui/card";
import { CheckCircle2, ListTodo, Trophy, TrendingUp, Check, Smile, Frown, Angry, Calendar, AlertCircle, Flame, RotateCcw, Meh, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { useNotifications } from "@/hooks/useNotifications";
import { differenceInMinutes, parse } from "date-fns";

interface ExtraClass {
  day: string;
  session: string;
  time: string;
  subject: string;
}

interface ScoresObj {
  tx1?: number;
  tx2?: number;
  tx3?: number;
  tx4?: number;
  tx5?: number;
  gk?: number;
  ck?: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { permission, requestPermission, notifyUpcomingClass } = useNotifications();
  const [achievementsCount, setAchievementsCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recoveryCount, setRecoveryCount] = useState(3);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [streakData, setStreakData] = useState<any>(null);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [lowScoreSubjects, setLowScoreSubjects] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState("10");
  const [selectedSemester, setSelectedSemester] = useState("1");
  const [averageScore, setAverageScore] = useState(0);
  const [accessFrequency, setAccessFrequency] = useState(0);
  const [notifiedClasses, setNotifiedClasses] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      // Load achievements
      const { data: achievementsData } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_unlocked", true);
      setAchievementsCount(achievementsData?.length || 0);

      // Load or initialize streak data
      let { data: streakInfo } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!streakInfo) {
        // Create new streak record
        const { data: newStreak } = await supabase
          .from("user_streaks")
          .insert({
            user_id: user.id,
            current_streak: 0,
            recovery_count: 3,
            last_recovery_reset: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();
        streakInfo = newStreak;
      }

      if (streakInfo) {
        setStreakData(streakInfo);
        setStreak(streakInfo.current_streak);
        setRecoveryCount(streakInfo.recovery_count);

        // Check if recovery count needs reset (new month)
        const today = new Date();
        const lastReset = new Date(streakInfo.last_recovery_reset);
        if (today.getMonth() !== lastReset.getMonth() || today.getFullYear() !== lastReset.getFullYear()) {
          await supabase
            .from("user_streaks")
            .update({
              recovery_count: 3,
              last_recovery_reset: today.toISOString().split('T')[0]
            })
            .eq("user_id", user.id);
          setRecoveryCount(3);
        }

        // Check if user can check in today
        const lastCheckIn = streakInfo.last_check_in ? new Date(streakInfo.last_check_in) : null;
        const todayStr = today.toISOString().split('T')[0];
        
        if (!lastCheckIn || lastCheckIn.toISOString().split('T')[0] !== todayStr) {
          setCanCheckIn(true);
        }
      }

      // Load today's schedule from both school and extra schedules
      const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
      const today = new Date();
      const todayName = dayNames[today.getDay()];
      
      const { data: scheduleData } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user.id);
      
      let todayClasses: any[] = [];
      
      if (scheduleData) {
        scheduleData.forEach(schedule => {
          if (schedule.schedule_type === "school") {
            // Get school schedule for today
            const schoolData = schedule.schedule_data as Record<string, Record<string, string>>;
            if (schoolData[todayName]) {
              Object.entries(schoolData[todayName]).forEach(([period, subject]) => {
                if (subject && subject.trim()) {
                  todayClasses.push({
                    type: "school",
                    period,
                    subject,
                    time: getPeriodTime(period)
                  });
                }
              });
            }
          } else if (schedule.schedule_type === "extra") {
            // Get extra classes for today
            const extraData = (schedule.schedule_data || []) as unknown as ExtraClass[];
            if (Array.isArray(extraData)) {
              extraData.forEach((extraClass: any) => {
                if (extraClass.day === todayName) {
                  todayClasses.push({
                    type: "extra",
                    subject: extraClass.subject,
                    time: extraClass.time,
                    session: extraClass.session
                  });
                }
              });
            }
          }
        });
      }
      
      setTodaySchedule(todayClasses);

      // Load scores for selected grade and semester
      const { data: scoresData } = await supabase
        .from("user_scores")
        .select("*")
        .eq("user_id", user.id)
        .eq("grade", selectedGrade)
        .eq("semester", selectedSemester);
      
      if (scoresData) {
        setScores(scoresData);
        
        // Calculate weighted average score properly
        const subjectAverages = scoresData.map(s => {
          const scoresObj = (s.scores || {}) as ScoresObj;
          const tx1 = scoresObj.tx1 || 0;
          const tx2 = scoresObj.tx2 || 0;
          const tx3 = scoresObj.tx3 || 0;
          const tx4 = scoresObj.tx4 || 0;
          const tx5 = scoresObj.tx5 || 0;
          const gk = scoresObj.gk || 0;
          const ck = scoresObj.ck || 0;
          
          const hasScores = tx1 || tx2 || tx3 || tx4 || tx5 || gk || ck;
          
          if (hasScores) {
            const total = tx1 + tx2 + tx3 + tx4 + tx5 + (gk * 2) + (ck * 3);
            return total / 10;
          }
          return 0;
        }).filter(avg => avg > 0);
        
        const avg = subjectAverages.length > 0 
          ? subjectAverages.reduce((a, b) => a + b, 0) / subjectAverages.length 
          : 0;
        setAverageScore(Math.round(avg * 10) / 10); // Round to 1 decimal

        // Find low score subjects (< 6.5) using weighted average
        const lowSubjects = scoresData.filter(s => {
          const scoresObj = (s.scores || {}) as ScoresObj;
          const tx1 = scoresObj.tx1 || 0;
          const tx2 = scoresObj.tx2 || 0;
          const tx3 = scoresObj.tx3 || 0;
          const tx4 = scoresObj.tx4 || 0;
          const tx5 = scoresObj.tx5 || 0;
          const gk = scoresObj.gk || 0;
          const ck = scoresObj.ck || 0;
          
          const hasScores = tx1 || tx2 || tx3 || tx4 || tx5 || gk || ck;
          
          if (hasScores) {
            const total = tx1 + tx2 + tx3 + tx4 + tx5 + (gk * 2) + (ck * 3);
            const subjectAvg = total / 10;
            return subjectAvg < 6.5;
          }
          return false;
        });
        setLowScoreSubjects(lowSubjects);
      }

      // Calculate access frequency (số lần truy cập trong 7 ngày qua)
      setAccessFrequency(5); // Mock data, có thể implement tracking thực tế
    };
    
    loadData();
  }, [user, selectedGrade, selectedSemester]);

  // Check for upcoming classes every minute
  useEffect(() => {
    if (!user || permission !== 'granted') return;

    const checkUpcomingClasses = () => {
      const now = new Date();

      todaySchedule.forEach((classItem) => {
        // Parse time from different formats
        let classTime = "";
        if (classItem.time && classItem.time.includes("-")) {
          classTime = classItem.time.split("-")[0].trim();
        }

        if (!classTime) return;

        // Convert time to Date object
        const [hours, minutes] = classTime.split(":").map(Number);
        const classDate = new Date(now);
        classDate.setHours(hours, minutes, 0, 0);
        
        const minutesUntil = differenceInMinutes(classDate, now);

        // Notify 15 minutes before class if not already notified
        const notificationKey = `${classItem.subject}-${classTime}-${now.toDateString()}`;
        if (minutesUntil > 0 && minutesUntil <= 15 && !notifiedClasses.has(notificationKey)) {
          notifyUpcomingClass(classItem.subject, classTime, minutesUntil);
          setNotifiedClasses(prev => new Set(prev).add(notificationKey));
        }
      });
    };

    checkUpcomingClasses();
    const interval = setInterval(checkUpcomingClasses, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, permission, todaySchedule, notifiedClasses, notifyUpcomingClass]);

  // Helper function to get period time
  const getPeriodTime = (period: string): string => {
    const periodTimes: Record<string, string> = {
      "Tiết 1": "7:00 - 7:45",
      "Tiết 2": "7:50 - 8:35",
      "Tiết 3": "8:50 - 9:35",
      "Tiết 4": "9:40 - 10:25",
      "Tiết 5": "10:30 - 11:15",
      "Tiết 6": "12:45 - 13:30",
      "Tiết 7": "13:35 - 14:20",
      "Tiết 8": "14:35 - 15:20",
      "Tiết 9": "15:25 - 16:10",
      "Tiết 10": "16:15 - 17:00"
    };
    return periodTimes[period] || "";
  };

  const handleCheckIn = async () => {
    if (!user || !canCheckIn) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastCheckIn = streakData?.last_check_in ? new Date(streakData.last_check_in) : null;
    const lastCheckInStr = lastCheckIn?.toISOString().split('T')[0];

    let newStreak = 1;
    
    if (lastCheckInStr === yesterdayStr) {
      // Consecutive day
      newStreak = (streakData?.current_streak || 0) + 1;
    } else if (lastCheckInStr === todayStr) {
      // Already checked in today
      toast({
        title: t('alreadyCheckedIn'),
        description: t('comeBackTomorrow'),
      });
      return;
    }

    const { data, error } = await supabase
      .from("user_streaks")
      .update({
        current_streak: newStreak,
        last_check_in: todayStr,
        longest_streak: Math.max(newStreak, streakData?.longest_streak || 0)
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (!error && data) {
      setStreak(newStreak);
      setStreakData(data);
      setCanCheckIn(false);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: t('checkInSuccess'),
        description: t('streakMessage').replace('{streak}', newStreak.toString()),
      });
    }
  };

  const handleRecoverStreak = async () => {
    if (!user || recoveryCount <= 0 || !streakData) return;

    const { data, error } = await supabase
      .from("user_streaks")
      .update({
        current_streak: streakData.longest_streak || 1,
        recovery_count: recoveryCount - 1,
        last_check_in: new Date().toISOString().split('T')[0]
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (!error && data) {
      setStreak(data.current_streak);
      setRecoveryCount(data.recovery_count);
      setStreakData(data);
      setCanCheckIn(false);

      toast({
        title: t('recoveredStreak'),
        description: t('recoveryMessage').replace('{count}', data.recovery_count.toString()),
      });
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'bạn';

  // Get mood based on average score only
  const getMoodData = () => {
    if (averageScore >= 8) {
      return {
        icon: Smile,
        message: t('doingGreat'),
        color: "text-success"
      };
    } else if (averageScore >= 5) {
      return {
        icon: Meh,
        message: t('needMoreEffort'),
        color: "text-warning"
      };
    } else {
      return {
        icon: Angry,
        message: t('notTryingHard'),
        color: "text-destructive"
      };
    }
  };

  const moodData = getMoodData();
  const MoodIcon = moodData.icon;

  // Prepare chart data - calculate average with proper weights
  const chartData = scores.map(s => {
    const scoresObj = s.scores || {};
    // Calculate average: (TX1 + TX2 + TX3 + TX4 + TX5 + GK*2 + CK*3) / 10
    const tx1 = scoresObj.tx1 || 0;
    const tx2 = scoresObj.tx2 || 0;
    const tx3 = scoresObj.tx3 || 0;
    const tx4 = scoresObj.tx4 || 0;
    const tx5 = scoresObj.tx5 || 0;
    const gk = scoresObj.gk || 0;
    const ck = scoresObj.ck || 0;
    
    // Check if we have any scores
    const hasScores = tx1 || tx2 || tx3 || tx4 || tx5 || gk || ck;
    
    let avg = 0;
    if (hasScores) {
      const total = tx1 + tx2 + tx3 + tx4 + tx5 + (gk * 2) + (ck * 3);
      avg = total / 10;
    }
    
    return {
      subject: s.subject,
      score: parseFloat(avg.toFixed(1))
    };
  });


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <Card className="p-8 bg-gradient-to-r from-primary via-primary/90 to-accent border-none overflow-hidden relative">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">
              {t('welcomeBack')}, {displayName}!
            </h2>
            <p className="text-primary-foreground/90 mb-6">
              {t('welcomeMessage')}
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleCheckIn}
                disabled={!canCheckIn}
                className="bg-white text-primary hover:bg-white/90 disabled:opacity-50"
              >
                <Check className="w-5 h-5 mr-2" />
                {canCheckIn ? t('checkInToday') : t('checkedIn')}
              </Button>
              {streak === 0 && streakData && streakData.longest_streak > 0 && recoveryCount > 0 && (
                <Button 
                  onClick={handleRecoverStreak}
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('recover')} ({recoveryCount})
                </Button>
              )}
              {permission !== 'granted' && (
                <Button 
                  onClick={requestPermission}
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Bật thông báo
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-sm text-primary-foreground/80">{t('streak')}</p>
                <p className="text-3xl font-bold text-primary-foreground">{streak} {t('days')}</p>
              </div>
            </div>
            <p className="text-xs text-primary-foreground/60">{t('recoveryLeft')}: {recoveryCount}/3</p>
          </div>
        </div>
      </Card>

      {/* Stats Cards and Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Lịch học hôm nay</p>
          <p className="text-3xl font-bold mb-2">{todaySchedule.length}</p>
          <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-sm border-l-2 border-primary/30 pl-2 py-1">
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-foreground">{item.subject}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.time}
                      {item.type === "extra" && item.session && ` • ${item.session}`}
                      {item.type === "school" && item.period && ` • ${item.period}`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Không có lịch học hôm nay</p>
            )}
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Môn điểm thấp</p>
          <p className="text-3xl font-bold mb-2">{lowScoreSubjects.length}</p>
          <div className="mt-3 space-y-2">
            {lowScoreSubjects.length > 0 ? (
              lowScoreSubjects.slice(0, 2).map((item: any, idx: number) => {
                const scoresObj = (item.scores || {}) as ScoresObj;
                const tx1 = scoresObj.tx1 || 0;
                const tx2 = scoresObj.tx2 || 0;
                const tx3 = scoresObj.tx3 || 0;
                const tx4 = scoresObj.tx4 || 0;
                const tx5 = scoresObj.tx5 || 0;
                const gk = scoresObj.gk || 0;
                const ck = scoresObj.ck || 0;
                const hasScores = tx1 || tx2 || tx3 || tx4 || tx5 || gk || ck;
                const subjectAvg = hasScores ? ((tx1 + tx2 + tx3 + tx4 + tx5 + (gk * 2) + (ck * 3)) / 10) : 0;
                
                return (
                  <div key={idx} className="flex items-center justify-between text-sm border-l-2 border-destructive/30 pl-2 py-1">
                    <span className="font-medium">{item.subject}</span>
                    <span className="text-destructive font-semibold">{subjectAvg.toFixed(1)}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-success font-medium">Tất cả môn đều tốt!</p>
            )}
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-warning" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Thành tích đạt được</p>
          <p className="text-3xl font-bold">{achievementsCount}</p>
          <p className="text-xs text-muted-foreground mt-2">Tổng số huy hiệu</p>
        </Card>

        {/* Average Score with Mood */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center justify-center h-full">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
              moodData.color === "text-success" ? "bg-success/10" :
              moodData.color === "text-warning" ? "bg-warning/10" : "bg-destructive/10"
            }`}>
              <MoodIcon className={`w-10 h-10 ${moodData.color}`} />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Điểm trung bình</p>
            <p className="text-4xl font-bold mb-2">{averageScore > 0 ? averageScore.toFixed(1) : '0.0'}</p>
            <p className={`text-center font-medium text-sm ${moodData.color}`}>
              {moodData.message}
            </p>
          </div>
        </Card>
      </div>

      {/* Activities Section */}
      <div className="grid grid-cols-1 gap-6">

      {/* Subjects Need More Study */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Môn cần học nhiều hơn</h3>
        </div>

        <div className="space-y-4">
          {lowScoreSubjects.length > 0 ? (
            lowScoreSubjects.map((subject, index) => {
              const scoresObj = (subject.scores || {}) as ScoresObj;
              const tx1 = scoresObj.tx1 || 0;
              const tx2 = scoresObj.tx2 || 0;
              const tx3 = scoresObj.tx3 || 0;
              const tx4 = scoresObj.tx4 || 0;
              const tx5 = scoresObj.tx5 || 0;
              const gk = scoresObj.gk || 0;
              const ck = scoresObj.ck || 0;
              const hasScores = tx1 || tx2 || tx3 || tx4 || tx5 || gk || ck;
              const avg = hasScores ? ((tx1 + tx2 + tx3 + tx4 + tx5 + (gk * 2) + (ck * 3)) / 10) : 0;
              
              return (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    </div>
                  <div>
                    <h4 className="font-semibold">{subject.subject}</h4>
                    <p className="text-sm text-muted-foreground">Điểm trung bình: {avg.toFixed(1)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-destructive">Cần ôn tập thêm</p>
                  <p className="text-xs text-muted-foreground">Lớp {subject.grade} - HK {subject.semester}</p>
                </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-success mb-4" />
              <p className="text-lg font-semibold text-success">Xuất sắc! Tất cả các môn đều tốt</p>
              <p className="text-sm text-muted-foreground mt-2">Bạn đang học tập rất tốt, hãy tiếp tục phát huy!</p>
            </div>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
};

export default Dashboard;
