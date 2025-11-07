import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MistakeStats {
  total_mistakes: number;
  unreviewed_count: number;
  repeated_mistakes: number;
  repeat_rate: number;
  formula_errors: number;
  data_errors: number;
  theory_errors: number;
  calculation_errors: number;
}

interface SubjectStats {
  subject: string;
  count: number;
}

interface ChapterStats {
  chapter: string;
  count: number;
  subject: string;
}

const ERROR_COLORS = {
  formula: '#ef4444',
  data: '#f59e0b',
  theory: '#8b5cf6',
  calculation: '#06b6d4'
};

const MistakeStatsDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MistakeStats | null>(null);
  const [topSubject, setTopSubject] = useState<SubjectStats | null>(null);
  const [topChapter, setTopChapter] = useState<ChapterStats | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      // Get aggregated stats
      const { data: mistakeData } = await supabase
        .from('quiz_mistakes')
        .select('*')
        .eq('user_id', user.id);

      if (mistakeData) {
        const total = mistakeData.length;
        const unreviewed = mistakeData.filter(m => !m.is_reviewed).length;
        const repeated = mistakeData.filter(m => (m.times_repeated || 1) > 1).length;
        
        const formula = mistakeData.filter(m => m.error_type === 'formula').length;
        const data = mistakeData.filter(m => m.error_type === 'data').length;
        const theory = mistakeData.filter(m => m.error_type === 'theory').length;
        const calculation = mistakeData.filter(m => m.error_type === 'calculation').length;

        setStats({
          total_mistakes: total,
          unreviewed_count: unreviewed,
          repeated_mistakes: repeated,
          repeat_rate: total > 0 ? Math.round((repeated / total) * 100) : 0,
          formula_errors: formula,
          data_errors: data,
          theory_errors: theory,
          calculation_errors: calculation
        });

        // Calculate top subject
        const subjectCounts = mistakeData.reduce((acc, m) => {
          acc[m.subject] = (acc[m.subject] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topSubj = Object.entries(subjectCounts)
          .sort(([,a], [,b]) => b - a)[0];
        
        if (topSubj) {
          setTopSubject({ subject: topSubj[0], count: topSubj[1] });
        }

        // Calculate top chapter
        const chapterCounts = mistakeData
          .filter(m => m.chapter)
          .reduce((acc, m) => {
            const key = `${m.subject}|${m.chapter}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

        const topChap = Object.entries(chapterCounts)
          .sort(([,a], [,b]) => b - a)[0];
        
        if (topChap) {
          const [subject, chapter] = topChap[0].split('|');
          setTopChapter({ chapter, count: topChap[1], subject });
        }

        // Calculate weekly progress
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const lastWeekMistakes = mistakeData.filter(m => 
          new Date(m.created_at) > oneWeekAgo
        ).length;

        const prevWeekMistakes = mistakeData.filter(m => {
          const date = new Date(m.created_at);
          return date > twoWeeksAgo && date <= oneWeekAgo;
        }).length;

        if (prevWeekMistakes > 0) {
          const progress = Math.round(((prevWeekMistakes - lastWeekMistakes) / prevWeekMistakes) * 100);
          setWeeklyProgress(progress);
        }
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) return null;

  const errorData = [
    { name: 'Sai công thức', value: stats.formula_errors, color: ERROR_COLORS.formula },
    { name: 'Nhầm số liệu', value: stats.data_errors, color: ERROR_COLORS.data },
    { name: 'Hiểu sai lý thuyết', value: stats.theory_errors, color: ERROR_COLORS.theory },
    { name: 'Cẩu thả tính toán', value: stats.calculation_errors, color: ERROR_COLORS.calculation },
  ].filter(item => item.value > 0);

  const ProgressIcon = weeklyProgress > 0 ? TrendingUp : weeklyProgress < 0 ? TrendingDown : Minus;
  const progressColor = weeklyProgress > 0 ? 'text-success' : weeklyProgress < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-2">
        <h2 className="text-2xl font-bold mb-6 text-center">Hồ Sơ Lỗi Sai Của Bạn</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-background/80 backdrop-blur p-4 rounded-lg border">
            <div className="text-sm text-muted-foreground mb-1">Tổng số câu sai</div>
            <div className="text-3xl font-bold text-destructive">{stats.total_mistakes}</div>
          </div>
          
          <div className="bg-background/80 backdrop-blur p-4 rounded-lg border">
            <div className="text-sm text-muted-foreground mb-1">Tỷ lệ lặp lại lỗi</div>
            <div className="text-3xl font-bold text-warning">{stats.repeat_rate}%</div>
          </div>
          
          <div className="bg-background/80 backdrop-blur p-4 rounded-lg border">
            <div className="text-sm text-muted-foreground mb-1">Mức độ tiến bộ</div>
            <div className={`text-3xl font-bold flex items-center gap-2 ${progressColor}`}>
              {weeklyProgress > 0 ? '+' : ''}{weeklyProgress}%
              <ProgressIcon className="w-6 h-6" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">so với tuần trước</div>
          </div>
        </div>

        {errorData.length > 0 && (
          <div className="bg-background/80 backdrop-blur p-6 rounded-lg border mb-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Phân loại lỗi sai</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={errorData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {errorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topSubject && (
            <div className="bg-background/80 backdrop-blur p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-1">Môn hay sai nhất</div>
              <div className="text-xl font-bold">{topSubject.subject}</div>
              <div className="text-sm text-muted-foreground">({topSubject.count} lỗi)</div>
            </div>
          )}
          
          {topChapter && (
            <div className="bg-background/80 backdrop-blur p-4 rounded-lg border">
              <div className="text-sm text-muted-foreground mb-1">Chương sai nhiều nhất</div>
              <div className="text-xl font-bold">{topChapter.chapter}</div>
              <div className="text-sm text-muted-foreground">
                {topChapter.subject} ({topChapter.count} lỗi)
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MistakeStatsDashboard;
