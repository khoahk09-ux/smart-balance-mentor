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

// Flame SVG Component - Purple/Pink flame with glow effect
function FlameSVG({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Outer glow layer with animation */}
      <motion.path 
        d="M50 110C50 110 70 95 75 75C78 62 72 50 70 35C68 25 62 20 60 10C60 10 55 18 50 22C45 18 40 10 40 10C38 20 32 25 30 35C28 50 22 62 25 75C30 95 50 110 50 110Z" 
        fill="url(#flameGlow)" 
        opacity="0.6"
        filter="url(#glow)"
        animate={{
          scale: [1, 1.08, 1.02, 1.06, 1],
          opacity: [0.6, 0.7, 0.55, 0.65, 0.6]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Main flame body with flicker */}
      <motion.path 
        d="M50 105C50 105 68 92 72 75C75 63 70 52 68 40C66 32 61 28 59 18C59 18 55 24 50 27C45 24 41 18 41 18C39 28 34 32 32 40C30 52 25 63 28 75C32 92 50 105 50 105Z" 
        fill="url(#flameMain)"
        animate={{
          scale: [1, 1.04, 0.99, 1.02, 1],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Inner highlight with subtle movement */}
      <motion.path 
        d="M50 95C50 95 62 85 65 72C67 63 64 55 62 47C61 42 57 39 56 32C56 32 53 36 50 38C47 36 44 32 44 32C43 39 39 42 38 47C36 55 33 63 35 72C38 85 50 95 50 95Z" 
        fill="url(#flameHighlight)" 
        opacity="0.8"
        animate={{
          scale: [1, 1.06, 1.01, 1.04, 1],
          y: [0, -1, 0, -0.5, 0]
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Core bright center with intense flicker */}
      <motion.path 
        d="M50 85C50 85 58 78 60 68C61 62 59 57 58 52C57 48 55 46 54 42C54 42 52 44 50 45C48 44 46 42 46 42C45 46 43 48 42 52C41 57 39 62 40 68C42 78 50 85 50 85Z" 
        fill="url(#flameCore)"
        animate={{
          scale: [1, 1.1, 0.95, 1.08, 1],
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
        {/* Glow gradient - outermost */}
        <radialGradient id="flameGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FF1493" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#9B5DE5" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6B35FF" stopOpacity="0.2" />
        </radialGradient>
        
        {/* Main flame gradient */}
        <linearGradient id="flameMain" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="20%" stopColor="#FF1493" />
          <stop offset="50%" stopColor="#9B5DE5" />
          <stop offset="100%" stopColor="#6B35FF" />
        </linearGradient>
        
        {/* Inner highlight gradient */}
        <linearGradient id="flameHighlight" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFF4E0" />
          <stop offset="30%" stopColor="#FFB4E6" />
          <stop offset="70%" stopColor="#C77DFF" />
          <stop offset="100%" stopColor="#9B5DE5" />
        </linearGradient>
        
        {/* Core bright gradient */}
        <radialGradient id="flameCore" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FFE4F8" />
          <stop offset="80%" stopColor="#FFB4E6" />
          <stop offset="100%" stopColor="#FF1493" />
        </radialGradient>
        
        {/* Glow filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
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
