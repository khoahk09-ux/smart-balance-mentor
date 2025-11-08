import { useEffect, useState } from 'react';
import maiFlower from '@/assets/mai-flower.png';

interface Flower {
  id: number;
  left: number;
  animationDuration: number;
  size: number;
  delay: number;
}

export const FallingFlowers = () => {
  const [flowers, setFlowers] = useState<Flower[]>([]);

  useEffect(() => {
    // Generate 12 random flowers
    const generatedFlowers = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // Random position from 0-100%
      animationDuration: 15 + Math.random() * 10, // 15-25 seconds
      size: 16 + Math.random() * 10, // 16-26px
      delay: Math.random() * 5, // 0-5 seconds delay
    }));
    setFlowers(generatedFlowers);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-1">
      {flowers.map((flower) => (
        <img
          key={flower.id}
          src={maiFlower}
          alt=""
          className="falling-flower"
          style={{
            left: `${flower.left}%`,
            width: `${flower.size}px`,
            height: `${flower.size}px`,
            animationDuration: `${flower.animationDuration}s`,
            animationDelay: `${flower.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
