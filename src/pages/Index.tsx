import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User, MessageCircle, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ScoreManagement from "@/components/ScoreManagement";
import ScheduleTable from "@/components/ScheduleTable";
import AIChat from "@/components/AIChat";
import Dashboard from "@/components/Dashboard";
import QuizTest from "@/components/QuizTest";
import Sidebar from "@/components/Sidebar";
import RightPanel from "@/components/RightPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Đã đăng xuất',
      description: 'Hẹn gặp lại bạn!',
    });
    navigate('/auth');
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "scores":
        return <ScoreManagement />;
      case "quiz":
        return <QuizTest />;
      case "schedule":
        return <ScheduleTable />;
      case "ai-tutor":
        return <AIChat />;
      case "profile":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Cài đặt</h2>
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => navigate('/subject-selection')}
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Môn chuyên
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-lg">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold capitalize">
                  {activeTab === "dashboard" ? "Dashboard" : 
                   activeTab === "scores" ? "Điểm số" :
                   activeTab === "quiz" ? "Kiểm tra" :
                   activeTab === "schedule" ? "Lịch học" :
                   activeTab === "ai-tutor" ? "AI Chat" :
                   "Cài đặt"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('vi-VN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative">
                  <MessageCircle className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
                </Button>
                <div className="flex items-center gap-3 pl-3 border-l border-border">
                  <div className="text-right">
                    <p className="text-sm font-semibold">Gareth Christopher</p>
                    <p className="text-xs text-muted-foreground">@christopher</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8">
          {renderContent()}
        </div>
      </main>

      {/* Right Panel */}
      <RightPanel />
    </div>
  );
};

export default Index;
