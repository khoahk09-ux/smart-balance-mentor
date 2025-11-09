import { useEffect } from 'react';

export const FallingFlowers = () => {
  useEffect(() => {
    const createFlower = () => {
      const flower = document.createElement("div");
      flower.className = "flower-rain";
      flower.textContent = "🌸";
      flower.style.left = Math.random() * 100 + "vw";
      flower.style.animationDuration = 4 + Math.random() * 3 + "s";
      flower.style.fontSize = 14 + Math.random() * 20 + "px";
      document.body.appendChild(flower);

      setTimeout(() => flower.remove(), 7000);
    };

    const interval = setInterval(createFlower, 400);
    return () => clearInterval(interval);
  }, []);

  return null;
};
