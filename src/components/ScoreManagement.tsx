import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import ScoreChart from "./ScoreChart";

const SUBJECTS = [
  "Toán", "Lý", "Hóa", "Sinh", "Văn", "Anh", 
  "Sử", "Địa", "KTPL", "Tin", "GDQP"
];

const GRADES = ["10", "11", "12"];
const SEMESTERS = ["Kỳ 1", "Kỳ 2"];

interface ScoreData {
  tx1: string;
  tx2: string;
  tx3: string;
  tx4: string;
  tx5: string;
  gk: string;
  ck: string;
}

const ScoreManagement = () => {
  const [grade, setGrade] = useState("10");
  const [semester, setSemester] = useState("Kỳ 1");
  const [selectedSubject, setSelectedSubject] = useState("Toán");
  const [scores, setScores] = useState<Record<string, ScoreData>>({});

  const calculateAverage = (subjectScores: ScoreData) => {
    const tx = [subjectScores.tx1, subjectScores.tx2, subjectScores.tx3, subjectScores.tx4, subjectScores.tx5]
      .filter(s => s && s !== "none" && !isNaN(parseFloat(s)))
      .map(s => parseFloat(s));
    
    const gk = subjectScores.gk && !isNaN(parseFloat(subjectScores.gk)) ? parseFloat(subjectScores.gk) : 0;
    const ck = subjectScores.ck && !isNaN(parseFloat(subjectScores.ck)) ? parseFloat(subjectScores.ck) : 0;

    if (tx.length === 0 || gk === 0 || ck === 0) return 0;

    const txSum = tx.reduce((a, b) => a + b, 0);
    const divisor = tx.length + 5; // tx count + 2 (GK) + 3 (CK)
    const average = (txSum + gk * 2 + ck * 3) / divisor;

    return parseFloat(average.toFixed(2));
  };

  const getMotivationMessage = (avg: number) => {
    if (avg === 0) return { message: "Hãy nhập điểm để bắt đầu!", color: "text-muted-foreground" };
    if (avg < 5) return { message: "Bạn bị hổng kiến thức nặng rồi 😰", color: "text-destructive" };
    if (avg < 6) return { message: "Trời ơi cố học thêm đi 😅", color: "text-destructive" };
    if (avg < 7) return { message: "Cần cố hơn nữa nha 💪", color: "text-warning" };
    if (avg < 8) return { message: "Gần đến đích rồi 🎯", color: "text-warning" };
    if (avg < 9) return { message: "Cố lên nha 🌟", color: "text-success" };
    return { message: "Xuất sắc! Tiếp tục phát huy 🏆", color: "text-success" };
  };

  const handleScoreChange = (field: keyof ScoreData, value: string) => {
    const key = `${grade}-${semester}-${selectedSubject}`;
    setScores(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { tx1: "", tx2: "", tx3: "", tx4: "", tx5: "", gk: "", ck: "" }),
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    const key = `${grade}-${semester}-${selectedSubject}`;
    const subjectScores = scores[key];
    
    if (!subjectScores) {
      toast.error("Vui lòng nhập điểm trước khi lưu!");
      return;
    }

    // Validate required scores
    if (!subjectScores.tx1 || !subjectScores.tx2 || !subjectScores.tx3 || !subjectScores.gk || !subjectScores.ck) {
      toast.error("Vui lòng nhập đầy đủ 3 cột thường xuyên bắt buộc, giữa kỳ và cuối kỳ!");
      return;
    }

    const avg = calculateAverage(subjectScores);
    const motivation = getMotivationMessage(avg);
    
    toast.success(`Đã lưu điểm ${selectedSubject}!`, {
      description: `Điểm trung bình: ${avg.toFixed(2)} - ${motivation.message}`
    });
  };

  const currentScores = scores[`${grade}-${semester}-${selectedSubject}`] || {
    tx1: "", tx2: "", tx3: "", tx4: "", tx5: "", gk: "", ck: ""
  };

  const currentAverage = calculateAverage(currentScores);
  const motivation = getMotivationMessage(currentAverage);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Quản lý điểm số</h2>
            <p className="text-sm text-muted-foreground">
              Nhập điểm của bạn để AI phân tích và đưa ra gợi ý học tập
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>

        {/* Grade & Semester Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Lớp</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map(g => (
                  <SelectItem key={g} value={g}>Lớp {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Học kỳ</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEMESTERS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Subject Tabs */}
        <Tabs value={selectedSubject} onValueChange={setSelectedSubject}>
          <TabsList className="w-full flex-wrap h-auto justify-start">
            {SUBJECTS.map(subject => (
              <TabsTrigger key={subject} value={subject} className="min-w-[80px]">
                {subject}
              </TabsTrigger>
            ))}
          </TabsList>

          {SUBJECTS.map(subject => (
            <TabsContent key={subject} value={subject} className="space-y-6 mt-6">
              {/* Score Input */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-secondary/30">
                  <h3 className="font-semibold mb-3 text-sm">Điểm thường xuyên</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">TX1 *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={currentScores.tx1}
                        onChange={(e) => handleScoreChange("tx1", e.target.value)}
                        placeholder="0-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">TX2 *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={currentScores.tx2}
                        onChange={(e) => handleScoreChange("tx2", e.target.value)}
                        placeholder="0-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">TX3 *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={currentScores.tx3}
                        onChange={(e) => handleScoreChange("tx3", e.target.value)}
                        placeholder="0-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">TX4 (Tùy chọn)</Label>
                      <Input
                        type="text"
                        value={currentScores.tx4}
                        onChange={(e) => handleScoreChange("tx4", e.target.value)}
                        placeholder="0-10 hoặc 'none'"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">TX5 (Tùy chọn)</Label>
                      <Input
                        type="text"
                        value={currentScores.tx5}
                        onChange={(e) => handleScoreChange("tx5", e.target.value)}
                        placeholder="0-10 hoặc 'none'"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-secondary/30">
                  <h3 className="font-semibold mb-3 text-sm">Điểm giữa kỳ</h3>
                  <div>
                    <Label className="text-xs">GK *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={currentScores.gk}
                      onChange={(e) => handleScoreChange("gk", e.target.value)}
                      placeholder="0-10"
                      className="h-12 text-lg"
                    />
                  </div>
                </Card>

                <Card className="p-4 bg-secondary/30">
                  <h3 className="font-semibold mb-3 text-sm">Điểm cuối kỳ</h3>
                  <div>
                    <Label className="text-xs">CK *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={currentScores.ck}
                      onChange={(e) => handleScoreChange("ck", e.target.value)}
                      placeholder="0-10"
                      className="h-12 text-lg"
                    />
                  </div>
                </Card>
              </div>

              {/* Average Display */}
              {currentAverage > 0 && (
                <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Điểm trung bình môn {subject}</p>
                      <p className="text-4xl font-bold">{currentAverage.toFixed(2)}</p>
                      <p className={`text-sm mt-2 font-medium ${motivation.color}`}>
                        {motivation.message}
                      </p>
                    </div>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${
                      currentAverage >= 8 ? "border-success bg-success/10 text-success" :
                      currentAverage >= 6.5 ? "border-warning bg-warning/10 text-warning" :
                      "border-destructive bg-destructive/10 text-destructive"
                    }`}>
                      {currentAverage.toFixed(1)}
                    </div>
                  </div>
                </Card>
              )}

              {/* Info */}
              <Card className="p-4 bg-muted/30 border-border/50">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Lưu ý:</strong> Các cột đánh dấu * là bắt buộc</p>
                    <p>• 3 cột TX đầu tiên (TX1, TX2, TX3) bắt buộc phải có</p>
                    <p>• TX4 và TX5 có thể để trống hoặc ghi "none" nếu không có</p>
                    <p>• Công thức tính: (Tổng TX + GK×2 + CK×3) / (Số cột TX + 5)</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} size="lg" className="gap-2">
            <Save className="w-4 h-4" />
            Lưu điểm
          </Button>
        </div>
      </Card>

      {/* Score Chart */}
      <ScoreChart scores={scores} grade={grade} semester={semester} />
    </div>
  );
};

export default ScoreManagement;
