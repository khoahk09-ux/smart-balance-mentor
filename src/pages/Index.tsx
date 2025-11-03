import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, MessageSquare, BarChart3, Target, Award } from "lucide-react";
import ScoreManagement from "@/components/ScoreManagement";
import ScheduleTable from "@/components/ScheduleTable";
import AIChat from "@/components/AIChat";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  SmartStudy Balance
                </h1>
                <p className="text-xs text-muted-foreground">Học thông minh, tiến xa hơn</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="scores" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Điểm số</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Thời khóa biểu</span>
            </TabsTrigger>
            <TabsTrigger value="ai-tutor" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">AI Trợ giúp</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="scores" className="space-y-6">
            <ScoreManagement />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <ScheduleTable />
          </TabsContent>

          <TabsContent value="ai-tutor" className="space-y-6">
            <AIChat />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
