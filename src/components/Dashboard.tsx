import { Card } from "@/components/ui/card";
import { CheckCircle2, ListTodo, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  // Mock data
  const weeklyActivity = [
    { day: "CN", ux: 2, frontend: 3, copywriting: 4 },
    { day: "T2", ux: 4, frontend: 4, copywriting: 3 },
    { day: "T3", ux: 3, frontend: 5, copywriting: 2 },
    { day: "T4", ux: 4, frontend: 3, copywriting: 5 },
    { day: "T5", ux: 5, frontend: 4, copywriting: 3 },
    { day: "T6", ux: 6, frontend: 5, copywriting: 4 },
    { day: "T7", ux: 4, frontend: 6, copywriting: 5 }
  ];

  const assignments = [
    {
      title: "Báo cáo Phân tích Toán",
      subject: "Toán học",
      date: "20 Tháng 10, 2027",
      status: "Đang thực hiện",
      progress: 30
    },
    {
      title: "Thuyết trình Văn",
      subject: "Ngữ văn",
      date: "25 Tháng 10, 2027",
      status: "Chưa bắt đầu",
      progress: 0
    }
  ];

  const maxValue = Math.max(...weeklyActivity.flatMap(d => [d.ux, d.frontend, d.copywriting]));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <Card className="p-8 bg-gradient-to-r from-primary via-primary/90 to-accent border-none overflow-hidden relative">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-primary-foreground mb-2">
              Xin chào, Gareth!
            </h2>
            <p className="text-primary-foreground/90 mb-6">
              Chúng tôi nhớ bạn! Hãy xem những gì mới và cải tiến trong bảng điều khiển của bạn.
            </p>
            <Button className="bg-white text-primary hover:bg-white/90">
              Khám phá thêm khóa học
            </Button>
          </div>
          <div className="w-64 h-48 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ListTodo className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Nhiệm vụ đang làm</p>
          <p className="text-3xl font-bold">18 Tasks</p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Nhiệm vụ hoàn thành</p>
          <p className="text-3xl font-bold">8 Tasks</p>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-warning" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">Điểm xếp hạng</p>
          <p className="text-3xl font-bold">132</p>
        </Card>
      </div>

      {/* Activity and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Hoạt động học tập</h3>
            <select className="text-sm text-muted-foreground border-none bg-transparent">
              <option>Tuần trước</option>
              <option>Tuần này</option>
            </select>
          </div>

          <div className="flex items-center gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#4169E1]"></div>
              <span>Toán học</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#FF69B4]"></div>
              <span>Văn học</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#FFD700]"></div>
              <span>Khoa học</span>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2">
            {weeklyActivity.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-1 items-center justify-end h-40">
                  <div 
                    className="w-full bg-[#FFD700] rounded-t"
                    style={{ height: `${(data.copywriting / maxValue) * 100}%` }}
                  ></div>
                  <div 
                    className="w-full bg-[#FF69B4] rounded-t"
                    style={{ height: `${(data.frontend / maxValue) * 100}%` }}
                  ></div>
                  <div 
                    className="w-full bg-[#4169E1] rounded-t"
                    style={{ height: `${(data.ux / maxValue) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-muted-foreground mt-2">{data.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* My Progress */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Tiến độ của tôi</h3>
            <button className="text-muted-foreground hover:text-foreground">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="hsl(var(--muted))"
                  strokeWidth="16"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#4169E1"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70 * 0.43} ${2 * Math.PI * 70}`}
                  strokeLinecap="round"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#FF69B4"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70 * 0.32} ${2 * Math.PI * 70}`}
                  strokeDashoffset={`${-2 * Math.PI * 70 * 0.43}`}
                  strokeLinecap="round"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#FFD700"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70 * 0.25} ${2 * Math.PI * 70}`}
                  strokeDashoffset={`${-2 * Math.PI * 70 * 0.75}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">124</span>
                <span className="text-xs text-muted-foreground">Tổng nhiệm vụ</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#4169E1]"></div>
                <span className="text-sm">Toán học</span>
              </div>
              <span className="text-sm font-semibold">43%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF69B4]"></div>
                <span className="text-sm">Văn học</span>
              </div>
              <span className="text-sm font-semibold">32%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FFD700]"></div>
                <span className="text-sm">Khoa học</span>
              </div>
              <span className="text-sm font-semibold">25%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Assignments */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Bài tập</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Tìm kiếm nhiệm vụ, khóa học..." 
                className="pl-8 pr-4 py-2 text-sm border rounded-lg bg-background"
              />
              <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <select className="text-sm border rounded-lg px-3 py-2 bg-background">
              <option>Tất cả trạng thái</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {assignments.map((assignment, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{assignment.title}</h4>
                  <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-muted-foreground">{assignment.date}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  assignment.status === "Đang thực hiện" 
                    ? "bg-warning/10 text-warning" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {assignment.status}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{assignment.progress}%</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${assignment.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
                  </svg>
                  <span className="text-xs">2</span>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="ml-2">
                    <path d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm2-2a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1h-7zM0 13a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 16 13V6a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 0 6v7z"/>
                  </svg>
                  <span className="text-xs">24</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
