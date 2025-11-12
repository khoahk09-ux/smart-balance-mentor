import { useEffect } from 'react';

export const FallingFlowers = () => {
  useEffect(() => {
    const createFlower = () => {
      const flower = document.createElement("div");
      flower.className = "flower-rain";
      flower.textContent = "🌸";
      
      // 70% cơ hội hoa rơi ở 2 bên, 30% ở giữa
      const sideChance = Math.random();
      let position;
      
      if (sideChance < 0.7) {
        // Rơi ở 2 bên (0-25% hoặc 75-100%)
        if (Math.random() < 0.5) {
          position = Math.random() * 25; // Bên trái (0-25%)
        } else {
          position = 75 + Math.random() * 25; // Bên phải (75-100%)
        }
      } else {
        // Rơi ở giữa (25-75%)
        position = 25 + Math.random() * 50;
      }
      
      flower.style.left = position + "vw";
      flower.style.animationDuration = 4 + Math.random() * 3 + "s";
      flower.style.fontSize = 14 + Math.random() * 20 + "px";
      document.body.appendChild(flower);

      setTimeout(() => flower.remove(), 5000);
    };

    const interval = setInterval(createFlower, 1500);
    return () => clearInterval(interval);
  }, []);

  return null;
};
