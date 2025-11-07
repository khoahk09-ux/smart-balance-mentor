import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Target, Award, Star, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import confetti from "canvas-confetti";

interface BadgeAchievement {
  id: string;
  icon: any;
  title: string;
  description: string;
  unlocked: boolean;
  color: string;
}

const ReviewBadges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeAchievement[]>([]);
  const [todayFixed, setTodayFixed] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    loadBadges();
  }, [user]);

  useEffect(() => {
    if (todayFixed >= 5 && !showCelebration) {
      celebrateAchievement();
      setShowCelebration(true);
    }
  }, [todayFixed]);

  const celebrateAchievement = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const loadBadges = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's stats
      const { data: todayStats } = await supabase
        .from('daily_review_stats')
        .select('mistakes_fixed')
        .eq('user_id', user.id)
        .eq('review_date', today)
        .single();

      const fixed = todayStats?.mistakes_fixed || 0;
      setTodayFixed(fixed);

      // Get all time stats
      const { data: allStats } = await supabase
        .from('daily_review_stats')
        .select('mistakes_fixed')
        .eq('user_id', user.id);

      const totalFixed = allStats?.reduce((sum, stat) => sum + stat.mistakes_fixed, 0) || 0;

      // Get mistake data for improvement calculation
      const { data: mistakes } = await supabase
        .from('quiz_mistakes')
        .select('times_repeated')
        .eq('user_id', user.id);

      const noRepeatMistakes = mistakes?.filter(m => (m.times_repeated || 1) === 1).length || 0;
      const totalMistakes = mistakes?.length || 1;
      const noRepeatRate = (noRepeatMistakes / totalMistakes) * 100;

      // Get recent improvement
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: recentMistakes } = await supabase
        .from('quiz_mistakes')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const { data: olderMistakes } = await supabase
        .from('quiz_mistakes')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', fourteenDaysAgo.toISOString())
        .lt('created_at', sevenDaysAgo.toISOString());

      const recentCount = recentMistakes?.length || 0;
      const olderCount = olderMistakes?.length || 1;
      const improvementRate = ((olderCount - recentCount) / olderCount) * 100;

      const badgesList: BadgeAchievement[] = [
        {
          id: 'daily_hero',
          icon: Flame,
          title: 'Chiến Thần Sửa Bài',
          description: 'Hoàn thành 5 câu ôn tập trong ngày',
          unlocked: fixed >= 5,
          color: 'text-orange-500'
        },
        {
          id: 'improvement',
          icon: TrendingUp,
          title: 'Giảm Sai 10%',
          description: 'Giảm số lỗi sai xuống 10% so với tuần trước',
          unlocked: improvementRate >= 10,
          color: 'text-green-500'
        },
        {
          id: 'no_repeat',
          icon: Target,
          title: 'Không Sai Lặp Lại',
          description: 'Trên 80% lỗi không lặp lại lần 2',
          unlocked: noRepeatRate >= 80,
          color: 'text-blue-500'
        },
        {
          id: 'master',
          icon: Trophy,
          title: 'Bậc Thầy Ôn Tập',
          description: 'Hoàn thành 50 lượt ôn tập',
          unlocked: totalFixed >= 50,
          color: 'text-yellow-500'
        },
        {
          id: 'perfectionist',
          icon: Star,
          title: 'Hoàn Hảo',
          description: 'Hoàn thành 100% lịch ôn trong 7 ngày',
          unlocked: false, // TODO: implement this logic
          color: 'text-purple-500'
        }
      ];

      setBadges(badgesList);

    } catch (error) {
      console.error("Error loading badges:", error);
    }
  };

  const unlockedBadges = badges.filter(b => b.unlocked);
  const lockedBadges = badges.filter(b => !b.unlocked);

  return (
    <div className="space-y-6">
      {todayFixed >= 5 && (
        <Card className="p-6 bg-gradient-to-br from-success/10 to-primary/10 border-success/20 border-2 animate-in fade-in slide-in-from-bottom duration-500">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">
              Bạn đã sửa xong {todayFixed} lỗi sai hôm nay!
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              Tiến bộ của bạn rất rõ 💪
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {unlockedBadges.map(badge => {
                const Icon = badge.icon;
                return (
                  <Badge key={badge.id} className="px-3 py-1 gap-2 bg-primary">
                    <Icon className="w-4 h-4" />
                    {badge.title}
                  </Badge>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">Huy Hiệu Của Bạn</h3>
        </div>

        {unlockedBadges.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
              Đã mở khóa ({unlockedBadges.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unlockedBadges.map(badge => {
                const Icon = badge.icon;
                return (
                  <Card key={badge.id} className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-background ${badge.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{badge.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {badge.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {lockedBadges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
              Chưa mở khóa ({lockedBadges.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lockedBadges.map(badge => {
                const Icon = badge.icon;
                return (
                  <Card key={badge.id} className="p-4 opacity-50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{badge.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {badge.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        🔒
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReviewBadges;
