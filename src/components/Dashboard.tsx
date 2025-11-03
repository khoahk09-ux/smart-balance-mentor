import { Card } from "@/components/ui/card";
import { Award, TrendingUp, BookOpen, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  // Mock data - will be replaced with real data from Lovable Cloud
  const stats = {
    averageScore: 0,
    testsCompleted: 0,
    weeklyGoal: 0,
    badges: 0
  };

  const recentScores = [
    { subject: "Toán", score: 0, status: "pending" },
    { subject: "Lý", score: 0, status: "pending" },
    { subject: "Hóa", score: 0, status: "pending" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Chào mừng trở lại! 👋</h2>
            <p className="text-muted-foreground">
              Hãy bắt đầu hành trình học tập thông minh của bạn ngay hôm nay
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="font-semibold text-success">Sẵn sàng học!</span>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Target className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Điểm TB</p>
              <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bài kiểm tra</p>
              <p className="text-2xl font-bold">{stats.testsCompleted}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-warning/70 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-warning-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mục tiêu tuần</p>
              <p className="text-2xl font-bold">{stats.weeklyGoal}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-success/70 flex items-center justify-center">
              <Award className="w-6 h-6 text-success-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Huy hiệu</p>
              <p className="text-2xl font-bold">{stats.badges}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Điểm số gần đây
          </h3>
          <div className="space-y-4">
            {recentScores.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">{item.subject}</span>
                </div>
                <div className="text-right">
                  {item.score > 0 ? (
                    <span className={`text-lg font-bold ${
                      item.score >= 8 ? "text-success" : 
                      item.score >= 6.5 ? "text-warning" : 
                      "text-destructive"
                    }`}>
                      {item.score.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Chưa có điểm</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Tiến độ học tập
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Số bài kiểm tra hoàn thành</span>
                <span className="text-sm text-muted-foreground">{stats.testsCompleted} / 0</span>
              </div>
              <Progress value={0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Làm bài kiểm tra để mở khóa tiến độ và huy hiệu!
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium mb-1">Bắt đầu hành trình</p>
                  <p className="text-sm text-muted-foreground">
                    Nhập điểm số và làm bài kiểm tra đầu tiên để nhận huy hiệu!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="p-6 bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
        <h3 className="text-xl font-bold mb-4">💡 Gợi ý học tập</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Nhập điểm số của bạn ở tab "Điểm số" để AI phân tích và đưa ra gợi ý học tập phù hợp</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Tạo thời khóa biểu để quản lý thời gian học tập hiệu quả</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Sử dụng AI Trợ giúp để giải đáp thắc mắc và làm bài kiểm tra củng cố kiến thức</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default Dashboard;
