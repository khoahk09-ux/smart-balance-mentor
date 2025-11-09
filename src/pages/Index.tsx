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

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [inputText, setInputText] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();

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

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg = inputText;
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInputText("");

    try {
      const { data, error } = await supabase.functions.invoke('ai-tutor-chat', {
        body: { messages: [{ role: "user", content: userMsg }] }
      });

      if (error) throw error;

      // Handle streaming response
      const reader = data.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                aiResponse += content;
                setMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  if (lastMsg?.sender === "ai") {
                    return [...prev.slice(0, -1), { sender: "ai", text: aiResponse }];
                  }
                  return [...prev, { sender: "ai", text: aiResponse }];
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { sender: "ai", text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại." }]);
    }
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
      case "ai-tutor":
        return <AIChat />;
      case "profile":
        return (
          <div className="p-6 max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">{t('settings')}</h2>
            <div className="space-y-6">
              {/* Language Settings */}
              <div className="space-y-3 p-4 border border-border rounded-lg bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">{t('languageSettings')}</Label>
                </div>
                <Select value={language} onValueChange={(value: 'vi' | 'en' | 'zh') => setLanguage(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">
                      <span className="flex items-center gap-2">
                        🇻🇳 {t('vietnamese')}
                      </span>
                    </SelectItem>
                    <SelectItem value="en">
                      <span className="flex items-center gap-2">
                        🇬🇧 {t('english')}
                      </span>
                    </SelectItem>
                    <SelectItem value="zh">
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
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t('specializedSubject')}
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start text-destructive hover:text-destructive"
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
              <div>
                <h1 className="text-2xl font-bold capitalize">
                  {activeTab === "dashboard" ? t('dashboard') : 
                   activeTab === "scores" ? t('scores') :
                   activeTab === "quiz" ? t('quiz') :
                   activeTab === "mistakes" ? "Ôn tập lỗi sai" :
                   activeTab === "schedule" ? t('schedule') :
                   activeTab === "achievements" ? t('achievements') :
                   activeTab === "ai-tutor" ? t('aiChat') :
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

      {/* Chat Bubble Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-accent hover:bg-accent/80 p-4 rounded-full shadow-lg hover:scale-105 transition-all z-50"
      >
        💬
      </button>

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-card border border-border rounded-2xl shadow-xl flex flex-col z-50">
          <div className="flex items-center justify-between px-4 py-3 bg-accent/20 rounded-t-2xl border-b border-border">
            <span className="font-semibold text-sm">AI Chat</span>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="hover:text-destructive transition-colors"
            >
              ✖
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 max-w-[75%] rounded-lg text-sm ${
                  msg.sender === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border">
            <input
              className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Nhập tin nhắn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
