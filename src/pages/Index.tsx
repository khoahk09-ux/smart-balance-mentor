import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User, MessageCircle, Bell, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ScoreManagement from "@/components/ScoreManagement";
import ScheduleTable from "@/components/ScheduleTable";
import AIChat from "@/components/AIChat";
import Dashboard from "@/components/Dashboard";
import QuizTest from "@/components/QuizTest";
import Achievements from "@/components/Achievements";
import MistakeReview from "@/components/MistakeReview";
import Sidebar from "@/components/Sidebar";
import RightPanel from "@/components/RightPanel";
import FloatingChat from "@/components/FloatingChat";
import StreakDisplay from "@/components/StreakDisplay";
import { useStreak } from "@/hooks/useStreak";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { currentStreak, longestStreak, canCheckIn, loading, checkIn } = useStreak();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const username = user?.email?.split('@')[0] || 'christopher';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: t('logoutSuccess'),
      description: t('logoutMessage'),
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
      case "mistakes":
        return <MistakeReview />;
      case "schedule":
        return <ScheduleTable />;
      case "achievements":
        return <Achievements />;
      case "profile":
        return (
          <div className="p-6 max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">{t('settings')}</h2>
            <div className="space-y-6">
              {/* Language Settings */}
              <div className="space-y-3 p-5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(31,38,135,0.37)]">
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="w-5 h-5 text-[#FF6B35]" />
                  <Label className="text-base font-semibold text-[#FF6B35]">{t('languageSettings')}</Label>
                </div>
                <Select 
                  value={language} 
                  onValueChange={(value: 'vi' | 'en' | 'zh') => {
                    setLanguage(value);
                    const languageNames = {
                      vi: '🇻🇳 Tiếng Việt',
                      en: '🇬🇧 English',
                      zh: '🇨🇳 中文'
                    };
                    toast({
                      title: t('success'),
                      description: `${t('languageSettings')}: ${languageNames[value]}`,
                    });
                  }}
                >
                  <SelectTrigger className="w-full rounded-xl bg-white/10 backdrop-blur-sm border-white/30 text-[#FFB088] hover:bg-white/20 hover:text-[#FF6B35] transition-all">
                    <SelectValue placeholder={t('selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white/90 backdrop-blur-md border-white/30">
                    <SelectItem value="vi" className="cursor-pointer hover:bg-[#FF6B35]/10">
                      <span className="flex items-center gap-2">
                        🇻🇳 {t('vietnamese')}
                      </span>
                    </SelectItem>
                    <SelectItem value="en" className="cursor-pointer hover:bg-[#FF6B35]/10">
                      <span className="flex items-center gap-2">
                        🇬🇧 {t('english')}
                      </span>
                    </SelectItem>
                    <SelectItem value="zh" className="cursor-pointer hover:bg-[#FF6B35]/10">
                      <span className="flex items-center gap-2">
                        🇨🇳 {t('chinese')}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Other Settings */}
              <Button
                variant="outline"
                onClick={() => navigate('/subject-selection')}
                className="w-full justify-start rounded-xl bg-white/10 backdrop-blur-sm border-white/30 text-[#FFB088] hover:bg-white/20 hover:text-[#FF6B35] transition-all"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t('specializedSubject')}
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start rounded-xl bg-white/10 backdrop-blur-sm border-white/30 text-[#FFB088] hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30 transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('logout')}
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
              <div className="flex items-center gap-6">
                <div>
                  <h1 className="text-2xl font-bold capitalize">
                    {activeTab === "dashboard" ? t('dashboard') : 
                     activeTab === "scores" ? t('scores') :
                     activeTab === "quiz" ? t('quiz') :
                     activeTab === "mistakes" ? "Ôn tập lỗi sai" :
                     activeTab === "schedule" ? t('schedule') :
                     activeTab === "achievements" ? t('achievements') :
                     t('settings')}
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
                
                {/* Streak Display */}
                {!loading && (
                  <StreakDisplay
                    currentStreak={currentStreak}
                    longestStreak={longestStreak}
                    canCheckIn={canCheckIn}
                    onCheckIn={checkIn}
                  />
                )}
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
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground">@{username}</p>
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

      {/* Floating Chat Component */}
      <FloatingChat />
    </div>
  );
};

export default Index;
