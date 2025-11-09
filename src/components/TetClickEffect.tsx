import { useEffect } from "react";

export const TetClickEffect = () => {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const effects = ["🧧", "🎆", "🌸", "🎉", "🎇", "💮"];
      const el = document.createElement("div");
      el.className = "tet-effect";
      el.textContent = effects[Math.floor(Math.random() * effects.length)];
      el.style.left = e.pageX + "px";
      el.style.top = e.pageY + "px";
      el.style.fontSize = 18 + Math.random() * 24 + "px";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
};
