import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
      colors: ['#FF6B35', '#FFA500', '#FFD700', '#FFB4C6', '#9B5DE5']
    });

    setTimeout(() => setIsAnimating(false), 1600);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const getFlameColor = () => {
    if (currentStreak >= 30) return "from-purple-400 via-pink-500 to-purple-600";
    if (currentStreak >= 21) return "from-blue-400 via-cyan-500 to-blue-600";
    if (currentStreak >= 14) return "from-green-400 via-emerald-500 to-green-600";
    if (currentStreak >= 7) return "from-yellow-400 via-orange-500 to-red-600";
    return "from-orange-400 via-pink-500 to-red-600";
  };

  return (
    <div className="relative">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, duration: 0.6 }}
        className={cn(
          "relative w-28 h-28 flex items-center justify-center",
          canCheckIn && "cursor-pointer"
        )}
        onClick={handleCheckIn}
        whileHover={canCheckIn ? { scale: 1.05 } : {}}
        whileTap={canCheckIn ? { scale: 0.95 } : {}}
      >
        {/* Confetti particles */}
        <AnimatePresence>
          {isAnimating && <ConfettiLayer />}
        </AnimatePresence>

        {/* Radial glow background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            className={cn(
              "w-32 h-32 rounded-full opacity-60",
              isAnimating && "opacity-80"
            )}
            animate={isAnimating ? {
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.8, 0.6]
            } : {}}
            transition={{ duration: 1.5, repeat: isAnimating ? Infinity : 0 }}
            style={{ 
              background: 'radial-gradient(circle at center, rgba(255,127,178,0.4), rgba(155,93,229,0.1))' 
            }} 
          />
        </div>

        {/* Main flame badge */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ 
            scale: isAnimating ? [1, 1.1, 1] : 1, 
            opacity: 1,
            rotate: isAnimating ? [0, 5, -5, 0] : 0
          }}
          transition={{ 
            scale: { duration: 0.6, repeat: isAnimating ? Infinity : 0 },
            rotate: { duration: 0.4, repeat: isAnimating ? Infinity : 0 }
          }}
          className={cn(
            "relative rounded-full p-5 shadow-2xl flex flex-col items-center justify-center z-10",
            `bg-gradient-to-br ${getFlameColor()}`
          )}
        >
          {/* Flame SVG */}
          <FlameSVG className="w-10 h-10 drop-shadow-2xl" />
          
          {/* Streak number */}
          <motion.div 
            className="mt-1 text-white text-2xl font-extrabold drop-shadow-lg"
            animate={isAnimating ? {
              scale: [1, 1.2, 1]
            } : {}}
            transition={{ duration: 0.5, repeat: isAnimating ? Infinity : 0 }}
          >
            {currentStreak}
          </motion.div>
        </motion.div>

        {/* Check-in hint */}
        {canCheckIn && !isAnimating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-6 text-xs text-white/80 font-medium whitespace-nowrap"
          >
            👆 Điểm danh
          </motion.div>
        )}

        {/* Longest streak badge */}
        {longestStreak > currentStreak && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-lg border-2 border-white/30 z-20"
          >
            🏆 {longestStreak}
          </motion.div>
        )}

        {/* New record badge */}
        {currentStreak === longestStreak && currentStreak > 0 && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-lg border-2 border-white/30 z-20"
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              ⭐
            </motion.span>
          </motion.div>
        )}
      </motion.div>

      {/* Celebration message */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-30"
          >
            <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-2xl border-2 border-white/30">
              🔥 +1 Streak!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Flame SVG Component
function FlameSVG({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <path 
        d="M32 58C32 58 44 47 44 34C44 22 34 18 34 10C34 10 30 18 22 22C22 22 26 30 26 36C26 50 32 58 32 58Z" 
        fill="url(#flameGradient)" 
      />
      <defs>
        <linearGradient id="flameGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="40%" stopColor="#EF476F" />
          <stop offset="100%" stopColor="#9B5DE5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Confetti particles animation
function ConfettiLayer() {
  const pieces = Array.from({ length: 18 });
  
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            y: -20, 
            x: 0,
            opacity: 0, 
            rotate: 0,
            scale: 0.5
          }}
          animate={{ 
            y: 60 + Math.random() * 40, 
            x: (Math.random() - 0.5) * 60,
            opacity: [0, 1, 1, 0],
            rotate: 360 + Math.random() * 360,
            scale: 1
          }}
          transition={{ 
            delay: 0.05 * i, 
            duration: 1.4 + Math.random() * 0.6,
            ease: "easeOut"
          }}
          className="absolute w-2 h-3 rounded-sm"
          style={{
            left: `${45 + Math.random() * 10}%`,
            top: `${35 + Math.random() * 10}%`,
            background: `linear-gradient(180deg, ${randColor()}, ${randColor()})`,
          }}
        />
      ))}
    </div>
  );
}

function randColor() {
  const colors = ["#FFB4C6", "#FFD166", "#9B5DE5", "#00BBF9", "#EF476F", "#FFA500", "#FF6B35"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default StreakDisplay;
