import { Card } from "@/components/ui/card";
import { CheckCircle2, ListTodo, Trophy, TrendingUp, Check, Smile, Frown, Angry, Calendar, AlertCircle, Flame, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
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

        // Find low score subjects (< 5)
        const lowSubjects = scoresData.filter(s => {
          const scoreValues = Object.values(s.scores || {}).filter((v): v is number => typeof v === 'number');
          const subjectAvg = scoreValues.length > 0 
            ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length 
            : 0;
          return subjectAvg < 5;
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
        title: "Đã check-in hôm nay!",
        description: "Bạn đã check-in rồi, hãy quay lại vào ngày mai nhé!",
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
        title: "🔥 Check-in thành công!",
        description: `Chuỗi của bạn: ${newStreak} ngày liên tục!`,
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
        title: "✨ Đã khôi phục chuỗi!",
        description: `Chuỗi của bạn đã được khôi phục. Còn ${data.recovery_count} lần khôi phục trong tháng này.`,
      });
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'bạn';

  // Get mood based on score and access frequency
  const getMoodData = () => {
    if (averageScore >= 8 && accessFrequency >= 5) {
      return {
        icon: Smile,
        message: "Bạn đang làm rất tốt cố lên!!",
        color: "text-success"
      };
    } else if (averageScore >= 5 && averageScore < 8) {
      return {
        icon: Frown,
        message: "Bạn cần cố gắng hơn nhé, cố lên nào",
        color: "text-warning"
      };
    } else {
      return {
        icon: Angry,
        message: "Bạn đang không cố gắng, cần cố gắng hơn nữa nhé",
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
              Xin chào bạn đã quay trở lại, {displayName}!
            </h2>
            <p className="text-primary-foreground/90 mb-6">
              Chúng tôi nhớ bạn! Hãy xem những gì mới và cải tiến trong bảng điều khiển của bạn.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleCheckIn}
                disabled={!canCheckIn}
                className="bg-white text-primary hover:bg-white/90 disabled:opacity-50"
              >
                <Check className="w-5 h-5 mr-2" />
                {canCheckIn ? "Check-in hôm nay" : "Đã check-in"}
              </Button>
              {streak === 0 && streakData && streakData.longest_streak > 0 && recoveryCount > 0 && (
                <Button 
                  onClick={handleRecoverStreak}
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Khôi phục ({recoveryCount})
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-sm text-primary-foreground/80">Chuỗi liên tục</p>
                <p className="text-3xl font-bold text-primary-foreground">{streak} ngày</p>
              </div>
            </div>
            <p className="text-xs text-primary-foreground/60">Khôi phục còn lại: {recoveryCount}/3</p>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Lịch học hôm nay</p>
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
          <p className="text-sm text-muted-foreground mb-1">Môn điểm còn thấp</p>
          <div className="mt-3 space-y-2">
            {lowScoreSubjects.length > 0 ? (
              lowScoreSubjects.slice(0, 2).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  <span className="font-medium">{item.subject}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-success">Tất cả môn đều tốt!</p>
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
        </Card>
      </div>

      {/* Activity and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Analysis Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Biểu đồ phân tích điểm</h3>
            <div className="flex items-center gap-2">
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Khối" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Khối 10</SelectItem>
                  <SelectItem value="11">Khối 11</SelectItem>
                  <SelectItem value="12">Khối 12</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Kỳ 1</SelectItem>
                  <SelectItem value="2">Kỳ 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="subject" 
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#ff6b35" 
                    strokeWidth={3}
                    dot={{ fill: '#ff6b35', r: 6, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Chưa có dữ liệu điểm
              </div>
            )}
          </div>
        </Card>

        {/* My Progress with Mood */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Tiến độ của tôi</h3>
          </div>

          <div className="flex flex-col items-center justify-center mb-6">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-4 ${
              moodData.color === "text-success" ? "bg-success/10" :
              moodData.color === "text-warning" ? "bg-warning/10" : "bg-destructive/10"
            }`}>
              <MoodIcon className={`w-20 h-20 ${moodData.color}`} />
            </div>
            <p className={`text-center font-semibold text-lg ${moodData.color}`}>
              {moodData.message}
            </p>
          </div>

          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium">Điểm trung bình</span>
              <span className="text-lg font-bold">{averageScore.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium">Truy cập (7 ngày)</span>
              <span className="text-lg font-bold">{accessFrequency} lần</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm font-medium">Chuỗi liên tục</span>
              <span className="text-lg font-bold">{streak} ngày</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Subjects Need More Study */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Những môn cần học nhiều hơn</h3>
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
                      <p className="text-sm text-muted-foreground">Điểm trung bình: {avg.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-destructive">Cần cải thiện</p>
                    <p className="text-xs text-muted-foreground">Khối {subject.grade} - Kỳ {subject.semester}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-success mb-4" />
              <p className="text-lg font-semibold text-success">Xuất sắc!</p>
              <p className="text-sm text-muted-foreground mt-2">Tất cả các môn đều có điểm tốt. Hãy tiếp tục phát huy!</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
