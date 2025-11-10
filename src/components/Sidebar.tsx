import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo.png";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const { t } = useLanguage();
  const [quizMenuOpen, setQuizMenuOpen] = useState(false);

  return (
    <div className="w-64 bg-[#FFF9F5] h-screen p-4 flex flex-col gap-3 text-[#5C4B3B] sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <img src={logo} alt="SmartStudy Balance Logo" className="w-12 h-12 rounded-xl" />
        <div>
          <h1 className="font-bold text-lg text-[#F25C3C]">SmartStudy</h1>
          <p className="text-sm text-gray-500">Balance</p>
        </div>
      </div>

      {/* Dashboard */}
      <button
        onClick={() => onTabChange("dashboard")}
        className={cn(
          "flex items-center gap-2 px-2 py-2 rounded-lg transition-colors",
          activeTab === "dashboard" ? "bg-[#F25C3C] text-white" : "hover:text-[#F25C3C]"
        )}
      >
        📊 Dashboard
      </button>

      {/* Điểm số */}
      <button
        onClick={() => onTabChange("scores")}
        className={cn(
          "flex items-center gap-2 px-2 py-2 rounded-lg transition-colors",
          activeTab === "scores" ? "bg-[#F25C3C] text-white" : "hover:text-[#F25C3C]"
        )}
      >
        🎯 Điểm số
      </button>

      {/* Kiểm tra + submenu - Glassmorphism style */}
      <div className="rounded-2xl p-3.5 bg-white/20 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(31,38,135,0.37)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(31,38,135,0.45)]">
        <button
          onClick={() => setQuizMenuOpen(!quizMenuOpen)}
          className={cn(
            "flex w-full justify-between items-center px-2.5 py-2 rounded-xl transition-all duration-300 font-semibold text-base",
            (activeTab === "quiz" || activeTab === "mistakes") 
              ? "bg-white/25 text-[#F25C3C] scale-[1.02]" 
              : "bg-white/10 hover:bg-white/25 hover:scale-[1.02]"
          )}
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            Kiểm tra
          </span>
          <span className="text-sm opacity-80">
            {quizMenuOpen ? "▼" : "▶"}
          </span>
        </button>

        {quizMenuOpen && (
          <div className="mt-2.5 flex flex-col gap-1.5">
            <button
              onClick={() => onTabChange("quiz")}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/10 transition-all duration-300 text-[15px]",
                activeTab === "quiz" 
                  ? "bg-white/25 text-[#F25C3C] font-medium translate-x-1.5" 
                  : "hover:bg-white/25 hover:translate-x-1.5"
              )}
            >
              <span>📄</span> Bài kiểm tra
            </button>
            <button
              onClick={() => onTabChange("mistakes")}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/10 transition-all duration-300 text-[15px]",
                activeTab === "mistakes" 
                  ? "bg-white/25 text-[#F25C3C] font-medium translate-x-1.5" 
                  : "hover:bg-white/25 hover:translate-x-1.5"
              )}
            >
              <span>📘</span> Ôn tập lỗi sai
            </button>
          </div>
        )}
      </div>

      {/* Lịch học */}
      <button
        onClick={() => onTabChange("schedule")}
        className={cn(
          "flex items-center gap-2 px-2 py-2 rounded-lg transition-colors",
          activeTab === "schedule" ? "bg-[#F25C3C] text-white" : "hover:text-[#F25C3C]"
        )}
      >
        📅 Lịch học
      </button>

      {/* Thành tích */}
      <button
        onClick={() => onTabChange("achievements")}
        className={cn(
          "flex items-center gap-2 px-2 py-2 rounded-lg transition-colors",
          activeTab === "achievements" ? "bg-[#F25C3C] text-white" : "hover:text-[#F25C3C]"
        )}
      >
        🏆 Thành tích
      </button>

      {/* Cài đặt */}
      <button
        onClick={() => onTabChange("profile")}
        className={cn(
          "flex items-center gap-2 px-2 py-2 rounded-lg transition-colors",
          activeTab === "profile" ? "bg-[#F25C3C] text-white" : "hover:text-[#F25C3C]"
        )}
      >
        ⚙️ Cài đặt
      </button>
    </div>
  );
};

export default Sidebar;
