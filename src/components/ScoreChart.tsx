import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const SUBJECTS = [
  "Toán", "Lý", "Hóa", "Sinh", "Văn", "Anh", 
  "Sử", "Địa", "KTPL", "Tin", "GDQP"
];

interface ScoreData {
  tx1: string;
  tx2: string;
  tx3: string;
  tx4: string;
  tx5: string;
  gk: string;
  ck: string;
}

interface ScoreChartProps {
  scores: Record<string, ScoreData>;
  grade: string;
  semester: string;
}

const ScoreChart = ({ scores, grade, semester }: ScoreChartProps) => {
  const calculateAverage = (subjectScores: ScoreData) => {
    const tx = [subjectScores.tx1, subjectScores.tx2, subjectScores.tx3, subjectScores.tx4, subjectScores.tx5]
      .filter(s => s && s !== "none" && !isNaN(parseFloat(s)))
      .map(s => parseFloat(s));
    
    const gk = subjectScores.gk && !isNaN(parseFloat(subjectScores.gk)) ? parseFloat(subjectScores.gk) : 0;
    const ck = subjectScores.ck && !isNaN(parseFloat(subjectScores.ck)) ? parseFloat(subjectScores.ck) : 0;

    if (tx.length === 0 || gk === 0 || ck === 0) return 0;

    const txSum = tx.reduce((a, b) => a + b, 0);
    const divisor = tx.length + 5;
    const average = (txSum + gk * 2 + ck * 3) / divisor;

    return parseFloat(average.toFixed(2));
  };

  const chartData = SUBJECTS.map(subject => {
    const key = `${grade}-${semester}-${subject}`;
    const subjectScores = scores[key];
    const average = subjectScores ? calculateAverage(subjectScores) : 0;

    return {
      subject,
      "Điểm TB": average,
      fill: average >= 8 ? "hsl(var(--success))" :
            average >= 6.5 ? "hsl(var(--warning))" :
            average > 0 ? "hsl(var(--destructive))" :
            "hsl(var(--muted))"
    };
  });

  const hasData = chartData.some(item => item["Điểm TB"] > 0);

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Biểu đồ điểm số - Lớp {grade} - {semester}</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="subject" 
              stroke="hsl(var(--foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              domain={[0, 10]} 
              stroke="hsl(var(--foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
            />
            <Legend />
            <Bar 
              dataKey="Điểm TB" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Chưa có dữ liệu điểm</p>
            <p className="text-sm text-muted-foreground">Nhập điểm để xem biểu đồ phân tích</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ScoreChart;
