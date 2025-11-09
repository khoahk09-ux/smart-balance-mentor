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

      {/* Kiểm tra + submenu */}
      <div>
        <button
          onClick={() => setQuizMenuOpen(!quizMenuOpen)}
          className={cn(
            "flex w-full justify-between items-center px-2 py-2 rounded-lg transition-colors",
            (activeTab === "quiz" || activeTab === "mistakes") ? "bg-[#F25C3C] text-white" : "hover:text-[#F25C3C]"
          )}
        >
          <span className="flex items-center gap-2">🧠 Kiểm tra</span>
          {quizMenuOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        {quizMenuOpen && (
          <div className="ml-6 mt-2 flex flex-col gap-2 text-sm">
            <button
              onClick={() => onTabChange("mistakes")}
              className={cn(
                "text-left px-2 py-1 rounded transition-colors",
                activeTab === "mistakes" ? "text-[#F25C3C] font-medium" : "hover:text-[#F25C3C]"
              )}
            >
              🔁 Ôn tập lỗi sai
            </button>
            <button
              onClick={() => onTabChange("quiz")}
              className={cn(
                "text-left px-2 py-1 rounded transition-colors",
                activeTab === "quiz" ? "text-[#F25C3C] font-medium" : "hover:text-[#F25C3C]"
              )}
            >
              📄 Bài kiểm tra
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

      {/* AI Chat */}
      <button
        onClick={() => onTabChange("ai-tutor")}
        className={cn(
          "flex items-center gap-2 px-2 py-2 rounded-lg transition-colors",
          activeTab === "ai-tutor" ? "bg-[#F25C3C] text-white" : "hover:text-[#F25C3C]"
        )}
      >
        💬 AI Chat
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
