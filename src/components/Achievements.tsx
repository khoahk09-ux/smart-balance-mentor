import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { achievements, achievementCategories, type AchievementCategory } from "@/lib/achievementData";
import AchievementCard from "./AchievementCard";
import confetti from "canvas-confetti";

interface UserAchievement {
  achievement_id: string;
  current_progress: number;
  target_progress: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
}

const Achievements = () => {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      setUserAchievements(data || []);
    } catch (error) {
      console.error("Error loading achievements:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thành tích",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const getUserProgress = (achievementId: string) => {
    return userAchievements.find((ua) => ua.achievement_id === achievementId);
  };

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<AchievementCategory, typeof achievements>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">🏆 Thành Tích</h1>
        <p className="text-muted-foreground">
          Hoàn thành các thử thách để mở khóa thành tích và nhận pháo hoa chúc mừng!
        </p>
      </div>

      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
        const categoryInfo = achievementCategories[category as AchievementCategory];
        const unlockedCount = categoryAchievements.filter(
          (ach) => getUserProgress(ach.id)?.is_unlocked
        ).length;

        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{categoryInfo.title}</h2>
                {categoryInfo.subtitle && (
                  <p className="text-sm text-muted-foreground">{categoryInfo.subtitle}</p>
                )}
              </div>
              <div className="text-sm font-semibold bg-muted px-3 py-1 rounded-full">
                {unlockedCount} / {categoryAchievements.length}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryAchievements.map((achievement) => {
                const progress = getUserProgress(achievement.id);
                return (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    currentProgress={progress?.current_progress || 0}
                    isUnlocked={progress?.is_unlocked || false}
                    onUnlock={triggerConfetti}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Achievements;
