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
            scale: isAnimating ? [1, 1.1, 1] : [1, 1.02, 1], 
            opacity: 1,
            rotate: isAnimating ? [0, 5, -5, 0] : 0
          }}
          transition={{ 
            scale: { duration: isAnimating ? 0.6 : 2, repeat: Infinity },
            rotate: { duration: 0.4, repeat: isAnimating ? Infinity : 0 }
          }}
          className={cn(
            "relative rounded-full p-5 shadow-2xl flex flex-col items-center justify-center z-10",
            `bg-gradient-to-br ${getFlameColor()}`
          )}
        >
          {/* Flame SVG with flicker animation */}
          <motion.div
            animate={{
              scale: [1, 1.05, 0.98, 1.03, 1],
              opacity: [1, 0.95, 1, 0.97, 1],
              y: [0, -1, 0, -0.5, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <FlameSVG className="w-10 h-10 drop-shadow-2xl" />
          </motion.div>
          
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

// Flame SVG Component - Simple drop-shaped flame
function FlameSVG({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 140" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Main flame body - simple teardrop shape */}
      <motion.path 
        d="M 50 20 C 50 20 30 40 30 70 C 30 95 38 115 50 115 C 62 115 70 95 70 70 C 70 40 50 20 50 20 Z"
        fill="url(#flameMain)"
        animate={{
          scale: [1, 1.03, 0.98, 1.02, 1],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Inner bright core */}
      <motion.path 
        d="M 50 45 C 50 45 42 55 42 72 C 42 85 45 95 50 95 C 55 95 58 85 58 72 C 58 55 50 45 50 45 Z"
        fill="url(#flameCore)"
        animate={{
          scale: [1, 1.08, 0.96, 1.05, 1],
          opacity: [1, 0.9, 1, 0.95, 1],
          y: [0, -2, 0, -1, 0]
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <defs>
        {/* Main flame gradient - pink to purple */}
        <linearGradient id="flameMain" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FF6B9D" />
          <stop offset="50%" stopColor="#C74B8C" />
          <stop offset="100%" stopColor="#9B5DE5" />
        </linearGradient>
        
        {/* Core bright gradient - white to purple */}
        <radialGradient id="flameCore" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor="#E4B5FF" />
          <stop offset="70%" stopColor="#B991FF" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </radialGradient>
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
