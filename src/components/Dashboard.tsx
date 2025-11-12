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
  const [newTask, setNewTask] = useState({ subject: '', task: '' });

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

  const handleAddTask = async () => {
    if (!user || !newTask.subject || !newTask.task) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('schedule')
        .insert({
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          subject: newTask.subject,
          task: newTask.task,
          completed: false,
        });

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã thêm task thành công!",
      });
      setNewTask({ subject: '', task: '' });
      
      // Reload schedule data
      const { data: scheduleData } = await supabase
        .from("schedule")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", new Date().toISOString().split('T')[0])
        .order("created_at", { ascending: true });
      
      if (scheduleData) {
        const todayClasses = scheduleData.map(item => ({
          id: item.id,
          type: "schedule",
          subject: item.subject,
          time: item.task,
          period: item.subject,
          completed: item.completed || false
        }));
        setTodaySchedule(todayClasses);
        
        const completedCount = scheduleData.filter(item => item.completed).length;
        setScheduleProgress({ completed: completedCount, total: scheduleData.length });
      }
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm task",
        variant: "destructive",
      });
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('schedule')
        .update({ completed: !completed })
        .eq('id', taskId);

      if (error) throw error;

      // Reload schedule data
      const { data: scheduleData } = await supabase
        .from("schedule")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", new Date().toISOString().split('T')[0])
        .order("created_at", { ascending: true });
      
      if (scheduleData) {
        const todayClasses = scheduleData.map(item => ({
          id: item.id,
          type: "schedule",
          subject: item.subject,
          time: item.task,
          period: item.subject,
          completed: item.completed || false
        }));
        setTodaySchedule(todayClasses);
        
        const completedCount = scheduleData.filter(item => item.completed).length;
        setScheduleProgress({ completed: completedCount, total: scheduleData.length });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật task",
        variant: "destructive",
      });
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'bạn';

  return (
    <div className="p-6 bg-gradient-to-b from-orange-50 to-white min-h-screen">
      {/* Falling Mai Flowers */}
      <FallingFlowers />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-orange-600">Dashboard</h1>
          <p className="text-sm text-gray-500">Cố gắng hôm nay để mai nở hoa thành công 🌸</p>
        </div>
        <Button 
          onClick={handleCheckIn}
          disabled={!canCheckIn}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl shadow-md"
        >
          {canCheckIn ? 'Check-in hôm nay' : 'Đã check-in'}
        </Button>
      </div>

      {/* Progress section - First row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Average Score Card */}
        <div className="bg-orange-100 rounded-2xl p-5 shadow hover:shadow-lg transition cursor-pointer">
          <h2 className="text-sm font-semibold text-gray-600">Điểm trung bình</h2>
          <p className="text-4xl font-bold text-orange-600 mt-2">
            {averageScore > 0 ? averageScore.toFixed(1) : '0.0'}/10
          </p>
          <p className={`text-xs mt-1 ${
            averageScore >= 8 ? 'text-green-600' : 
            averageScore >= 5 ? 'text-yellow-600' : 
            'text-red-500'
          }`}>
            {averageScore >= 8 ? 'Tuyệt vời! 🎉' : 
             averageScore >= 5 ? 'Cần cố gắng hơn nữa nhé 💪' : 
             'Cần cố gắng hơn nữa nhé 💪'}
          </p>
        </div>

        {/* Study Time Card */}
        <div className="bg-pink-100 rounded-2xl p-5 shadow hover:shadow-lg transition cursor-pointer">
          <h2 className="text-sm font-semibold text-gray-600">Thời lượng học hôm nay</h2>
          <p className="text-4xl font-bold text-pink-600 mt-2">
            {(studyTimeToday / 60).toFixed(1)}h
          </p>
          <p className="text-xs text-gray-500 mt-1">Mục tiêu: 3h/ngày</p>
        </div>

        {/* Schedule Progress Card */}
        <div className="bg-yellow-100 rounded-2xl p-5 shadow hover:shadow-lg transition cursor-pointer">
          <h2 className="text-sm font-semibold text-gray-600">Tiến độ lịch học</h2>
          <p className="text-4xl font-bold text-yellow-600 mt-2">
            {scheduleProgress.completed}/{scheduleProgress.total}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {scheduleProgress.total > 0 
              ? `${Math.round((scheduleProgress.completed / scheduleProgress.total) * 100)}% hoàn thành`
              : 'Chưa có lịch học'}
          </p>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Latest Achievement Card */}
        <div className="bg-amber-100 rounded-2xl p-5 shadow hover:shadow-lg transition cursor-pointer">
          <h2 className="text-sm font-semibold text-gray-600">Thành tích gần đây</h2>
          {latestAchievement ? (
            <>
              <p className="text-2xl font-bold text-amber-600 mt-2">{latestAchievement.title}</p>
              <p className="text-xs text-gray-500 mt-1">{latestAchievement.description}</p>
            </>
          ) : (
            <>
              <p className="text-4xl font-bold text-amber-600 mt-2">—</p>
              <p className="text-xs text-gray-500 mt-1">Chưa có thành tích</p>
            </>
          )}
        </div>

        {/* Low Score Subjects Count */}
        <div className="bg-rose-100 rounded-2xl p-5 shadow hover:shadow-lg transition cursor-pointer">
          <h2 className="text-sm font-semibold text-gray-600">Môn điểm thấp</h2>
          <p className="text-4xl font-bold text-rose-600 mt-2">{lowScoreSubjects.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {lowScoreSubjects.length > 0 ? 'Cần ôn tập thêm' : 'Chưa có dữ liệu'}
          </p>
        </div>

        {/* Streak Card */}
        <div className="bg-gradient-to-r from-orange-300 to-pink-300 text-white rounded-2xl p-5 shadow-lg">
          <h2 className="text-lg font-semibold">🌷 Mùa Xuân Rực Rỡ – Học Tập Thăng Hoa!</h2>
          <p className="text-sm mt-2">
            Chuỗi liên tục: <span className="font-bold">{streak} ngày</span>
          </p>
          <div className="flex gap-2 mt-3">
            <button 
              className="bg-white text-orange-600 px-3 py-1 rounded-lg shadow hover:bg-orange-50 text-sm font-medium"
            >
              Xem chuỗi học
            </button>
            {streak === 0 && streakData && streakData.longest_streak > 0 && recoveryCount > 0 && (
              <button
                onClick={handleRecoverStreak}
                className="bg-white/20 text-white px-3 py-1 rounded-lg shadow hover:bg-white/30 text-sm font-medium border border-white/30"
              >
                Khôi phục ({recoveryCount})
              </button>
            )}
            {permission !== 'granted' && (
              <button
                onClick={requestPermission}
                className="bg-white/20 text-white px-3 py-1 rounded-lg shadow hover:bg-white/30 text-sm font-medium border border-white/30"
              >
                Bật thông báo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar + Schedule */}
      <div className="grid grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">📅 Lịch học hôm nay</h2>
          
          {/* Add Task Form */}
          <div className="mb-4 space-y-2">
            <input
              type="text"
              placeholder="Môn học"
              value={newTask.subject}
              onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="text"
              placeholder="Nội dung học"
              value={newTask.task}
              onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={handleAddTask}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Thêm task
            </button>
          </div>

          {/* Task List */}
          {todaySchedule.length > 0 ? (
            <div className="space-y-2">
              {todaySchedule.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleTask(item.id, item.completed)}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.subject}
                    </p>
                    <p className={`text-xs ${item.completed ? 'line-through text-gray-300' : 'text-gray-500'}`}>
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Subjects Need More Study */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">🧠 Môn cần học nhiều hơn</h2>
          {lowScoreSubjects.length > 0 ? (
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {lowScoreSubjects.map((subject, index) => {
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
                  <li key={index} className="flex justify-between items-center">
                    <span>{subject.subject}</span>
                    <span className="text-rose-600 font-semibold text-sm">{avg.toFixed(1)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Chưa có môn nào cần ôn tập đặc biệt</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
