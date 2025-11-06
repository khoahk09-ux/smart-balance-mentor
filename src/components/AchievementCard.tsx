import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/lib/achievementData";

interface AchievementCardProps {
  achievement: Achievement;
  currentProgress: number;
  isUnlocked: boolean;
  onUnlock?: () => void;
}

const AchievementCard = ({
  achievement,
  currentProgress,
  isUnlocked,
  onUnlock,
}: AchievementCardProps) => {
  const progressPercentage = Math.min((currentProgress / achievement.target) * 100, 100);

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:scale-105",
        isUnlocked
          ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 shadow-lg"
          : "bg-muted/50 opacity-75 grayscale hover:grayscale-0"
      )}
    >
      <div className="p-6 space-y-4">
        {/* Icon */}
        <div
          className={cn(
            "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-4xl transition-all duration-300",
            isUnlocked
              ? "bg-gradient-to-br from-primary to-accent shadow-lg animate-pulse"
              : "bg-muted"
          )}
        >
          {achievement.icon}
        </div>

        {/* Name */}
        <div className="text-center space-y-1">
          <h3 className="font-bold text-lg leading-tight">{achievement.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {achievement.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-semibold">
              {currentProgress} / {achievement.target}
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className={cn(
              "h-2",
              isUnlocked && "bg-primary/20"
            )}
          />
        </div>

        {/* Unlock Status */}
        {isUnlocked && (
          <div className="absolute top-2 right-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <span className="text-lg">✓</span>
            </div>
          </div>
        )}

        {/* Lock Overlay for locked achievements */}
        {!isUnlocked && progressPercentage === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <span className="text-4xl opacity-30">🔒</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AchievementCard;
