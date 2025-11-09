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
import { FallingFlowers } from "@/components/FallingFlowers";
import maiBranch from "@/assets/mai-branch.png";

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
  const [studyTimeToday, setStudyTimeToday] = useState(0);
  const [scheduleProgress, setScheduleProgress] = useState({ completed: 0, total: 0 });
  const [latestAchievement, setLatestAchievement] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      // Load achievements from new achievements table
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user.id);
      
      if (achievementsError) {
        console.error('Error loading achievements:', achievementsError);
      }
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

      // Load today's schedule from new schedule table
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("schedule")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", todayStr)
        .order("created_at", { ascending: true });
      
      if (scheduleError) {
        console.error('Error loading schedule:', scheduleError);
      }
      
      let todayClasses: any[] = [];
      
      if (scheduleData && scheduleData.length > 0) {
        todayClasses = scheduleData.map(item => ({
          type: "schedule",
          subject: item.subject,
          time: item.task,
          period: item.subject,
          completed: item.completed || false
        }));
        
        // Calculate schedule progress
        const completedCount = scheduleData.filter(item => item.completed).length;
        setScheduleProgress({ completed: completedCount, total: scheduleData.length });
      } else {
        setScheduleProgress({ completed: 0, total: 0 });
      }
      
      setTodaySchedule(todayClasses);

      // Load study time for today
      const { data: studyData } = await supabase
        .from("study_sessions")
        .select("duration_minutes")
        .eq("user_id", user.id)
        .eq("session_date", todayStr);
      
      const totalMinutes = studyData?.reduce((sum, session) => sum + session.duration_minutes, 0) || 0;
      setStudyTimeToday(totalMinutes);

      // Load scores from user_scores table
      const { data: userScoresData, error: scoresError } = await supabase
        .from("user_scores")
        .select("*")
        .eq("user_id", user.id)
        .eq("grade", selectedGrade)
        .eq("semester", selectedSemester);
      
      if (scoresError) {
        console.error('Error loading scores:', scoresError);
      }
      
      if (userScoresData && userScoresData.length > 0) {
        const convertedScores = userScoresData.map(record => ({
          subject: record.subject,
          grade: record.grade,
          semester: record.semester,
          scores: record.scores
        }));
        
        setScores(convertedScores);
        
        // Calculate average score properly
        let totalScore = 0;
        let subjectCount = 0;
        
        userScoresData.forEach(record => {
          const scoresObj = record.scores as any;
          const tx = [scoresObj.tx1, scoresObj.tx2, scoresObj.tx3, scoresObj.tx4, scoresObj.tx5]
            .filter((s: any) => s && s !== "none" && !isNaN(parseFloat(s)))
            .map((s: any) => parseFloat(s));
          
          const gk = scoresObj.gk && !isNaN(parseFloat(scoresObj.gk)) ? parseFloat(scoresObj.gk) : 0;
          const ck = scoresObj.ck && !isNaN(parseFloat(scoresObj.ck)) ? parseFloat(scoresObj.ck) : 0;

          if (tx.length > 0 && gk > 0 && ck > 0) {
            const txSum = tx.reduce((a: number, b: number) => a + b, 0);
            const divisor = tx.length + 5;
            const average = (txSum + gk * 2 + ck * 3) / divisor;
            totalScore += average;
            subjectCount++;
          }
        });
        
        const overallAverage = subjectCount > 0 ? totalScore / subjectCount : 0;
        setAverageScore(Math.round(overallAverage * 10) / 10);

        // Find low score subjects (< 6.5)
        const lowSubjects = convertedScores.filter((item) => {
          const scoresObj = item.scores as any;
          const tx = [scoresObj.tx1, scoresObj.tx2, scoresObj.tx3, scoresObj.tx4, scoresObj.tx5]
            .filter((s: any) => s && s !== "none" && !isNaN(parseFloat(s)))
            .map((s: any) => parseFloat(s));
          
          const gk = scoresObj.gk && !isNaN(parseFloat(scoresObj.gk)) ? parseFloat(scoresObj.gk) : 0;
          const ck = scoresObj.ck && !isNaN(parseFloat(scoresObj.ck)) ? parseFloat(scoresObj.ck) : 0;

          if (tx.length > 0 && gk > 0 && ck > 0) {
            const txSum = tx.reduce((a: number, b: number) => a + b, 0);
            const divisor = tx.length + 5;
            const average = (txSum + gk * 2 + ck * 3) / divisor;
            return average < 6.5;
          }
          return false;
        });
        setLowScoreSubjects(lowSubjects);
      } else {
        setScores([]);
        setAverageScore(0);
        setLowScoreSubjects([]);
      }
      
      // Load latest achievement
      const { data: latestAch } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      setLatestAchievement(latestAch);

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
      {/* Falling Mai Flowers */}
      <FallingFlowers />
      
      {/* Welcome Banner - Tet Theme */}
      <Card className="p-8 bg-gradient-to-r from-tet-red via-primary to-tet-red-light border-none overflow-hidden relative">
        {/* Mai Branch Decoration */}
        <img 
          src={maiBranch} 
          alt="" 
          className="absolute top-0 right-0 h-full w-auto opacity-20 pointer-events-none"
          style={{ filter: 'brightness(1.2)' }}
        />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex-1">
            <h2 className="text-4xl font-extrabold text-white mb-2">
              Mùa Xuân rực rỡ – Học tập thăng hoa!
            </h2>
            <p className="text-xl font-script text-white/95 mb-6">
              Cố gắng hôm nay để mai nở hoa thành công
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleCheckIn}
                disabled={!canCheckIn}
                className="bg-mai text-foreground hover:bg-mai-dark font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                <Check className="w-5 h-5 mr-2" />
                {canCheckIn ? t('checkInToday') : t('checkedIn')}
              </Button>
              {streak === 0 && streakData && streakData.longest_streak > 0 && recoveryCount > 0 && (
                <Button 
                  onClick={handleRecoverStreak}
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('recover')} ({recoveryCount})
                </Button>
              )}
              {permission !== 'granted' && (
                <Button 
                  onClick={requestPermission}
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Bật thông báo
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 bg-white/15 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/30 shadow-xl">
            <div className="flex items-center gap-3">
              <Flame className="w-10 h-10 text-mai" />
              <div>
                <p className="text-sm text-white/80 font-medium">{t('streak')}</p>
                <p className="text-4xl font-extrabold text-white">{streak} {t('days')}</p>
              </div>
            </div>
            <p className="text-xs text-white/70 font-medium">{t('recoveryLeft')}: {recoveryCount}/3</p>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Average Score Card */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center h-full">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg ${
              moodData.color === "text-success" ? "bg-gradient-to-br from-success/20 to-success/40" :
              moodData.color === "text-warning" ? "bg-gradient-to-br from-warning/20 to-warning/40" : "bg-gradient-to-br from-destructive/20 to-destructive/40"
            }`}>
              <MoodIcon className={`w-10 h-10 ${moodData.color}`} />
            </div>
            <p className="text-sm text-muted-foreground mb-1 font-medium">📈 Điểm trung bình</p>
            <p className="text-4xl font-extrabold mb-2 text-foreground">{averageScore > 0 ? averageScore.toFixed(1) : '0.0'}/10</p>
            <p className={`text-center font-semibold text-sm ${moodData.color}`}>
              {moodData.message}
            </p>
          </div>
        </Card>

        {/* Study Time Card */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg bg-gradient-to-br from-primary/20 to-primary/40">
              <ListTodo className="w-10 h-10 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-1 font-medium">⏰ Thời lượng học hôm nay</p>
            <p className="text-4xl font-extrabold mb-2 text-foreground">{(studyTimeToday / 60).toFixed(1)}h</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min((studyTimeToday / 180) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Mục tiêu: 3 giờ/ngày</p>
          </div>
        </Card>

        {/* Schedule Progress Card */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg bg-gradient-to-br from-mai-light to-mai">
              <CheckCircle2 className="w-10 h-10 text-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1 font-medium">🧩 Tiến độ lịch học</p>
            <p className="text-4xl font-extrabold mb-2 text-foreground">
              {scheduleProgress.completed}/{scheduleProgress.total}
            </p>
            <p className="text-xs text-muted-foreground">
              {scheduleProgress.total > 0 
                ? `${Math.round((scheduleProgress.completed / scheduleProgress.total) * 100)}% hoàn thành`
                : "Chưa có lịch học"}
            </p>
          </div>
        </Card>

        {/* Latest Achievement Card */}
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg bg-gradient-to-br from-warning/30 to-warning/50">
              <Trophy className="w-10 h-10 text-warning" />
            </div>
            <p className="text-sm text-muted-foreground mb-1 font-medium">🏆 Thành tích gần đây</p>
            {latestAchievement ? (
              <>
                <p className="text-lg font-extrabold text-foreground text-center">{latestAchievement.title}</p>
                <p className="text-xs text-muted-foreground text-center mt-1">{latestAchievement.description}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có thành tích</p>
            )}
          </div>
        </Card>
      </div>

      {/* Original Cards - Keep below for backward compatibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-mai-light to-mai flex items-center justify-center shadow-md">
              <Calendar className="w-7 h-7 text-foreground" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1 font-medium">📅 Lịch học hôm nay</p>
          <p className="text-3xl font-extrabold mb-2 text-foreground">{todaySchedule.length}</p>
          <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-sm border-l-2 border-mai pl-3 py-1">
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{item.subject}</span>
                      {item.completed && <CheckCircle2 className="w-4 h-4 text-success" />}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.time}
                      {item.type === "extra" && item.session && ` • ${item.session}`}
                      {item.type === "school" && item.period && ` • ${item.period}`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/40 flex items-center justify-center shadow-md">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1 font-medium">Môn điểm thấp</p>
          <p className="text-3xl font-extrabold mb-2 text-foreground">{lowScoreSubjects.length}</p>
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
                  <div key={idx} className="flex items-center justify-between text-sm border-l-2 border-destructive/40 pl-3 py-1">
                    <span className="font-semibold">{item.subject}</span>
                    <span className="text-destructive font-bold">{subjectAvg.toFixed(1)}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
            )}
          </div>
        </Card>

      </div>

      {/* Activities Section */}
      <div className="grid grid-cols-1 gap-6">

      {/* Subjects Need More Study */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Môn cần học nhiều hơn</h3>
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
                <div key={index} className="flex items-center justify-between p-4 rounded-xl border-2 border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/40 flex items-center justify-center shadow-sm">
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                  <div>
                    <h4 className="font-bold text-lg">{subject.subject}</h4>
                    <p className="text-sm text-muted-foreground font-medium">Điểm trung bình: {avg.toFixed(1)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-destructive">Cần ôn tập thêm</p>
                  <p className="text-xs text-muted-foreground font-medium">Lớp {subject.grade} - HK {subject.semester}</p>
                </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg text-muted-foreground font-medium">Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
};

export default Dashboard;
