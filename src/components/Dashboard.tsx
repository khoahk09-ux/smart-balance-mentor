import { Card } from "@/components/ui/card";
import { CheckCircle2, ListTodo, Trophy, TrendingUp, Check, Smile, Frown, Angry, Calendar, AlertCircle, Flame, RotateCcw, Meh } from "lucide-react";
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

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
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

      // Load today's schedule
      const dayOfWeek = new Date().getDay();
      const { data: scheduleData } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user.id)
        .eq("schedule_type", "weekly");
      
      if (scheduleData && scheduleData[0]?.schedule_data) {
        const todayClasses = scheduleData[0].schedule_data[dayOfWeek] || [];
        setTodaySchedule(todayClasses);
      }

      // Load scores for selected grade and semester
      const { data: scoresData } = await supabase
        .from("user_scores")
        .select("*")
        .eq("user_id", user.id)
        .eq("grade", selectedGrade)
        .eq("semester", selectedSemester);
      
      if (scoresData) {
        setScores(scoresData);
        
        // Calculate average score
        const validScores = scoresData.flatMap(s => {
          const scoreValues = Object.values(s.scores || {}).filter((v): v is number => typeof v === 'number');
          return scoreValues;
        });
        const avg = validScores.length > 0 
          ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
          : 0;
        setAverageScore(avg);

        // Find low score subjects (< 6.5)
        const lowSubjects = scoresData.filter(s => {
          const scoreValues = Object.values(s.scores || {}).filter((v): v is number => typeof v === 'number');
          const subjectAvg = scoreValues.length > 0 
            ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length 
            : 0;
          return subjectAvg < 6.5;
        });
        setLowScoreSubjects(lowSubjects);
      }

      // Calculate access frequency (số lần truy cập trong 7 ngày qua)
      setAccessFrequency(5); // Mock data, có thể implement tracking thực tế
    };
    
    loadData();
  }, [user, selectedGrade, selectedSemester]);

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
          <p className="text-sm text-muted-foreground mb-1">{t('todaySchedule')}</p>
          <div className="mt-3 space-y-2">
            {todaySchedule.length > 0 ? (
              todaySchedule.slice(0, 2).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="font-medium">{item.subject}</span>
                  {item.time && <span className="text-muted-foreground">- {item.time}</span>}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t('noScheduleToday')}</p>
            )}
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{t('lowScoreSubjects')}</p>
          <div className="mt-3 space-y-2">
            {lowScoreSubjects.length > 0 ? (
              lowScoreSubjects.slice(0, 2).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  <span className="font-medium">{item.subject}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-success">{t('allSubjectsGood')}</p>
            )}
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-warning" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{t('achievementsEarned')}</p>
          <p className="text-3xl font-bold">{achievementsCount}</p>
        </Card>

        {/* My Progress with Mood */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center justify-center h-full">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-3 ${
              moodData.color === "text-success" ? "bg-success/10" :
              moodData.color === "text-warning" ? "bg-warning/10" : "bg-destructive/10"
            }`}>
              <MoodIcon className={`w-12 h-12 ${moodData.color}`} />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{t('averageScore')}</p>
            <p className="text-3xl font-bold mb-2">{averageScore > 0 ? averageScore.toFixed(1) : '--'}</p>
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
          <h3 className="text-lg font-semibold">{t('subjectsNeedImprovement')}</h3>
        </div>

        <div className="space-y-4">
          {lowScoreSubjects.length > 0 ? (
            lowScoreSubjects.map((subject, index) => {
              const scoreValues = Object.values(subject.scores || {}).filter((v): v is number => typeof v === 'number');
              const avg = scoreValues.length > 0 
                ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length 
                : 0;
              
              return (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    </div>
                  <div>
                    <h4 className="font-semibold">{subject.subject}</h4>
                    <p className="text-sm text-muted-foreground">{t('averageScore')}: {avg.toFixed(1)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-destructive">{t('needToStudyMore')}</p>
                  <p className="text-xs text-muted-foreground">{t('class')} {subject.grade} - {t('semester')} {subject.semester}</p>
                </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-success mb-4" />
              <p className="text-lg font-semibold text-success">{t('excellent')}</p>
              <p className="text-sm text-muted-foreground mt-2">{t('keepItUp')}</p>
            </div>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
};

export default Dashboard;
