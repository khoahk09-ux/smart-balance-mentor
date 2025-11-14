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

// Flame SVG Component - Fire emoji style
function FlameSVG({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 120 140" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Main body - yellow base */}
      <motion.path 
        d="M 60 120 C 75 120 90 110 90 90 C 90 75 85 65 80 55 C 75 45 70 40 65 30 C 62 40 58 45 52 55 C 48 62 45 70 42 80 C 40 85 35 90 35 95 C 35 110 45 120 60 120 Z"
        fill="url(#yellowBase)"
        animate={{
          scale: [1, 1.02, 0.99, 1.01, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Orange middle layer */}
      <motion.path 
        d="M 60 110 C 70 110 80 102 80 88 C 80 78 76 70 72 62 C 68 54 65 50 62 42 C 60 48 57 52 53 60 C 50 66 47 72 45 78 C 44 82 42 85 42 88 C 42 100 50 110 60 110 Z"
        fill="url(#orangeMiddle)"
        animate={{
          scale: [1, 1.04, 0.98, 1.02, 1],
        }}
        transition={{
          duration: 1.3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Red inner layer */}
      <motion.path 
        d="M 60 95 C 67 95 72 90 72 80 C 72 72 69 66 66 60 C 64 55 62 52 60 46 C 58 51 56 54 54 59 C 52 64 50 68 49 73 C 48 76 48 78 48 80 C 48 88 53 95 60 95 Z"
        fill="url(#redInner)"
        animate={{
          scale: [1, 1.06, 0.97, 1.03, 1],
          y: [0, -1, 0, -0.5, 0]
        }}
        transition={{
          duration: 1.1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Left dancing flame */}
      <motion.path 
        d="M 35 65 C 35 65 30 55 32 48 C 33 45 35 43 36 40 C 36 43 38 45 40 50 C 41 53 42 57 42 60 C 42 65 38 68 35 65 Z"
        fill="url(#yellowFlame)"
        animate={{
          scale: [1, 1.1, 0.95, 1.05, 1],
          x: [-1, 1, -0.5, 0.5, -1],
          rotate: [-5, 5, -3, 3, -5]
        }}
        transition={{
          duration: 0.9,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Right dancing flame */}
      <motion.path 
        d="M 85 55 C 85 55 88 47 87 42 C 86 39 84 37 83 35 C 84 37 84 40 83 44 C 82 47 81 51 80 54 C 79 58 82 59 85 55 Z"
        fill="url(#orangeFlame)"
        animate={{
          scale: [1, 1.08, 0.97, 1.04, 1],
          x: [1, -1, 0.5, -0.5, 1],
          rotate: [5, -5, 3, -3, 5]
        }}
        transition={{
          duration: 1.0,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Top center spark */}
      <motion.path 
        d="M 58 35 C 58 35 56 30 57 27 C 57.5 25.5 58.5 24.5 59 23 C 59 24.5 59.5 25.5 59.5 28 C 59.5 30 59.5 32 59 33 C 58.5 35 58 35 58 35 Z"
        fill="url(#redFlame)"
        animate={{
          scale: [1, 1.15, 0.9, 1.1, 1],
          y: [-2, 1, -1, 0.5, -2],
          opacity: [1, 0.8, 1, 0.9, 1]
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <defs>
        {/* Yellow base gradient */}
        <linearGradient id="yellowBase" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFF700" />
          <stop offset="50%" stopColor="#FFED4E" />
          <stop offset="100%" stopColor="#FFC837" />
        </linearGradient>
        
        {/* Orange middle gradient */}
        <linearGradient id="orangeMiddle" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FF9500" />
          <stop offset="50%" stopColor="#FF8C00" />
          <stop offset="100%" stopColor="#FF7F00" />
        </linearGradient>
        
        {/* Red inner gradient */}
        <linearGradient id="redInner" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FF4500" />
          <stop offset="50%" stopColor="#FF3800" />
          <stop offset="100%" stopColor="#E63900" />
        </linearGradient>
        
        {/* Yellow flame for sparks */}
        <linearGradient id="yellowFlame" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFEB3B" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
        
        {/* Orange flame for sparks */}
        <linearGradient id="orangeFlame" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FF9800" />
          <stop offset="100%" stopColor="#FF5722" />
        </linearGradient>
        
        {/* Red flame for top spark */}
        <linearGradient id="redFlame" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#F7931E" />
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
