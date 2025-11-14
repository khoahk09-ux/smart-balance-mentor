import { useEffect, useState } from "react";
import { Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  onCheckIn?: () => void;
  canCheckIn?: boolean;
}

const StreakDisplay = ({ 
  currentStreak, 
  longestStreak,
  onCheckIn,
  canCheckIn = false
}: StreakDisplayProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleCheckIn = () => {
    if (!canCheckIn || !onCheckIn) return;
    
    setIsAnimating(true);
    setShowCelebration(true);
    onCheckIn();

    // Confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.3 },
      colors: ['#FF6B35', '#FFA500', '#FFD700']
    });

    setTimeout(() => setIsAnimating(false), 1000);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const getFlameColor = () => {
    if (currentStreak >= 30) return "text-purple-400";
    if (currentStreak >= 21) return "text-blue-400";
    if (currentStreak >= 14) return "text-green-400";
    if (currentStreak >= 7) return "text-yellow-400";
    return "text-orange-400";
  };

  const getFlameSize = () => {
    if (currentStreak >= 30) return "text-4xl";
    if (currentStreak >= 21) return "text-3xl";
    if (currentStreak >= 14) return "text-2xl";
    if (currentStreak >= 7) return "text-xl";
    return "text-lg";
  };

  return (
    <div className="relative">
      <div 
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-300",
          "bg-gradient-to-r from-orange-500/20 via-red-500/20 to-yellow-500/20",
          "backdrop-blur-md border border-orange-400/30",
          "shadow-[0_0_20px_rgba(255,107,53,0.3)]",
          canCheckIn && "cursor-pointer hover:scale-105 hover:shadow-[0_0_30px_rgba(255,107,53,0.5)]",
          isAnimating && "scale-110 shadow-[0_0_40px_rgba(255,107,53,0.8)]"
        )}
        onClick={handleCheckIn}
      >
        {/* Fire Icon với animation */}
        <div className="relative">
          <Flame 
            className={cn(
              "transition-all duration-300",
              getFlameColor(),
              getFlameSize(),
              isAnimating && "animate-pulse"
            )}
            fill="currentColor"
          />
          
          {/* Glow effect */}
          <div className={cn(
            "absolute inset-0 blur-xl opacity-50 transition-opacity",
            getFlameColor(),
            isAnimating && "opacity-100"
          )}>
            <Flame fill="currentColor" className={getFlameSize()} />
          </div>

          {/* Sparkles khi streak cao */}
          {currentStreak >= 7 && (
            <Sparkles 
              className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse"
              fill="currentColor"
            />
          )}
        </div>

        {/* Streak Number */}
        <div className="flex flex-col">
          <div className={cn(
            "font-bold transition-all duration-300",
            getFlameSize(),
            "bg-gradient-to-r from-orange-400 via-red-400 to-yellow-400 bg-clip-text text-transparent"
          )}>
            {currentStreak}
          </div>
          <div className="text-[10px] text-white/70 -mt-1">
            {canCheckIn ? "Điểm danh" : "ngày"}
          </div>
        </div>

        {/* Longest Streak Badge */}
        {longestStreak > currentStreak && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg border border-white/20">
            🏆 {longestStreak}
          </div>
        )}

        {/* New Record Badge */}
        {currentStreak === longestStreak && currentStreak > 0 && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg border border-white/20 animate-pulse">
            ⭐ Kỷ lục
          </div>
        )}
      </div>

      {/* Celebration Text */}
      {showCelebration && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-fade-in shadow-lg">
            🔥 +1 Streak!
          </div>
        </div>
      )}

      {/* Floating particles animation */}
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-orange-400 rounded-full opacity-0"
              style={{
                left: `${Math.random() * 100}%`,
                animation: `float-up 1s ease-out ${i * 0.1}s forwards`
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-50px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default StreakDisplay;
