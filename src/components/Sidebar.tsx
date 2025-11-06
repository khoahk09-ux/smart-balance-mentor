import { BookOpen, BarChart3, Target, Calendar, MessageSquare, Settings, Brain, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "scores", label: "Điểm số", icon: Target },
    { id: "quiz", label: "Kiểm tra", icon: Brain },
    { id: "schedule", label: "Lịch học", icon: Calendar },
    { id: "achievements", label: "Thành tích", icon: Trophy },
    { id: "ai-tutor", label: "AI Chat", icon: MessageSquare },
    { id: "profile", label: "Cài đặt", icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-card border-r border-border/50 flex flex-col sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SmartStudy
            </h1>
            <p className="text-xs text-muted-foreground">Balance</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                activeTab === item.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
