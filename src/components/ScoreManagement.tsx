import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, CheckCircle2, TrendingUp, AlertCircle, Lightbulb, Save, Edit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ScoreChart from "./ScoreChart";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const SUBJECTS = [
  "Toán", "Lý", "Hóa", "Sinh", "Văn", "Anh", 
  "Sử", "Địa", "KTPL", "Tin", "GDQP"
];

const GRADES = ["10", "11", "12"];
const SEMESTERS = ["Kỳ 1", "Kỳ 2"];

interface ScoreData {
  tx1: number | null;
  tx2: number | null;
  tx3: number | null;
  tx4: number | null;
  tx5: number | null;
  gk: number | null;
  ck: number | null;
}

interface UserScoreRecord {
  id: string;
  scores: ScoreData;
  target_score: number | null;
  is_completed: boolean;
}

const ScoreManagement = () => {
  const { user } = useAuth();
  const [grade, setGrade] = useState("10");
  const [semester, setSemester] = useState("Kỳ 1");
  const [selectedSubject, setSelectedSubject] = useState("Toán");
  const [currentRecord, setCurrentRecord] = useState<UserScoreRecord | null>(null);
  const [targetScore, setTargetScore] = useState<string>("");
  const [allScores, setAllScores] = useState<Record<string, any>>({});

  // Load scores from database
  const loadScores = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_scores")
      .select("*")
      .eq("user_id", user.id)
      .eq("grade", grade)
      .eq("semester", semester)
      .eq("subject", selectedSubject)
      .maybeSingle();

    if (error) {
      console.error("Error loading scores:", error);
      return;
    }

    if (data) {
      setCurrentRecord({
        id: data.id,
        scores: data.scores as unknown as ScoreData,
        target_score: data.target_score,
        is_completed: data.is_completed,
      });
      setTargetScore(data.target_score?.toString() || "");
    } else {
      setCurrentRecord(null);
      setTargetScore("");
    }
  };

  // Load all scores for chart
  const loadAllScores = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_scores")
      .select("*")
      .eq("user_id", user.id)
      .eq("grade", grade)
      .eq("semester", semester);

    if (error) {
      console.error("Error loading all scores:", error);
      return;
    }

    const scoresMap: Record<string, any> = {};
    data?.forEach((record) => {
      const key = `${record.grade}-${record.semester}-${record.subject}`;
      scoresMap[key] = record.scores as unknown as ScoreData;
    });
    setAllScores(scoresMap);
  };

  useEffect(() => {
    loadScores();
    loadAllScores();
  }, [user, grade, semester, selectedSubject]);

  // Auto-save score when input changes
  const handleScoreChange = async (field: keyof ScoreData, value: string) => {
    if (!user) return;

    const numValue = value === "" ? null : parseFloat(value);
    const updatedScores = {
      ...(currentRecord?.scores || {
        tx1: null, tx2: null, tx3: null, tx4: null, tx5: null, gk: null, ck: null
      }),
      [field]: numValue,
    };

    // Update UI immediately
    setCurrentRecord(prev => ({
      id: prev?.id || "",
      scores: updatedScores,
      target_score: prev?.target_score || null,
      is_completed: prev?.is_completed || false,
    }));

    // Save to database
    const upsertData: any = {
      user_id: user.id,
      grade,
      semester,
      subject: selectedSubject,
      scores: updatedScores,
      target_score: currentRecord?.target_score || null,
      is_completed: false,
    };

    const { data, error } = await supabase
      .from("user_scores")
      .upsert(upsertData, {
        onConflict: "user_id,grade,semester,subject",
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving score:", error);
      toast.error("Lỗi khi lưu điểm!");
    } else if (data) {
      setCurrentRecord({
        id: data.id,
        scores: data.scores as unknown as ScoreData,
        target_score: data.target_score,
        is_completed: data.is_completed,
      });
      loadAllScores();
    }
  };

  // Save target score
  const handleTargetScoreChange = async (value: string) => {
    if (!user) return;
    setTargetScore(value);

    const numValue = value === "" ? null : parseFloat(value);

    const upsertData: any = {
      user_id: user.id,
      grade,
      semester,
      subject: selectedSubject,
      scores: currentRecord?.scores || {
        tx1: null, tx2: null, tx3: null, tx4: null, tx5: null, gk: null, ck: null
      },
      target_score: numValue,
      is_completed: currentRecord?.is_completed || false,
    };

    const { error } = await supabase
      .from("user_scores")
      .upsert(upsertData, {
        onConflict: "user_id,grade,semester,subject",
      });

    if (error) {
      console.error("Error saving target:", error);
      toast.error("Lỗi khi lưu mục tiêu!");
    } else {
      toast.success("Đã lưu mục tiêu điểm!");
      loadScores();
    }
  };

  // Complete scores
  const handleComplete = async () => {
    if (!user || !currentRecord) return;

    const scores = currentRecord.scores;
    const hasAllRequired = scores.tx1 !== null && scores.tx2 !== null && 
                          scores.tx3 !== null && scores.gk !== null && scores.ck !== null;

    if (!hasAllRequired) {
      toast.error("Vui lòng nhập đầy đủ các điểm bắt buộc (TX1, TX2, TX3, GK, CK)!");
      return;
    }

    const { error } = await supabase
      .from("user_scores")
      .update({ is_completed: true })
      .eq("id", currentRecord.id);

    if (error) {
      console.error("Error completing:", error);
      toast.error("Lỗi khi hoàn thành!");
    } else {
      toast.success("Đã hoàn thành nhập điểm!");
      loadScores();
    }
  };

  // Enable editing after completion
  const handleEdit = async () => {
    if (!user || !currentRecord) return;

    const { error } = await supabase
      .from("user_scores")
      .update({ is_completed: false })
      .eq("id", currentRecord.id);

    if (error) {
      console.error("Error enabling edit:", error);
      toast.error("Lỗi khi chỉnh sửa!");
    } else {
      toast.success("Đã bật chế độ chỉnh sửa!");
      loadScores();
    }
  };

  // Calculate average
  const calculateAverage = (scores: ScoreData) => {
    const tx = [scores.tx1, scores.tx2, scores.tx3, scores.tx4, scores.tx5]
      .filter(s => s !== null) as number[];
    
    const gk = scores.gk ?? 0;
    const ck = scores.ck ?? 0;

    if (tx.length === 0 || gk === 0 || ck === 0) return 0;

    const txSum = tx.reduce((a, b) => a + b, 0);
    const divisor = tx.length + 5;
    const average = (txSum + gk * 2 + ck * 3) / divisor;

    return parseFloat(average.toFixed(2));
  };

  // Calculate suggestion
  const calculateSuggestion = (scores: ScoreData, target: number) => {
    const emptyFields: string[] = [];
    const filledScores: number[] = [];
    let multiplierSum = 0;

    if (scores.tx1 !== null) { filledScores.push(scores.tx1); multiplierSum += 1; } else emptyFields.push("TX1");
    if (scores.tx2 !== null) { filledScores.push(scores.tx2); multiplierSum += 1; } else emptyFields.push("TX2");
    if (scores.tx3 !== null) { filledScores.push(scores.tx3); multiplierSum += 1; } else emptyFields.push("TX3");
    if (scores.tx4 !== null) { filledScores.push(scores.tx4); multiplierSum += 1; } else emptyFields.push("TX4");
    if (scores.tx5 !== null) { filledScores.push(scores.tx5); multiplierSum += 1; } else emptyFields.push("TX5");
    
    if (scores.gk !== null) { filledScores.push(scores.gk * 2); multiplierSum += 2; } else emptyFields.push("GK");
    if (scores.ck !== null) { filledScores.push(scores.ck * 3); multiplierSum += 3; } else emptyFields.push("CK");

    if (emptyFields.length === 0) return null;

    const filledSum = filledScores.reduce((a, b) => a + b, 0);
    const totalTX = [scores.tx1, scores.tx2, scores.tx3, scores.tx4, scores.tx5].filter(s => s !== null).length + emptyFields.filter(f => f.startsWith("TX")).length;
    const totalMultiplier = totalTX + 5;
    
    const requiredSum = target * totalMultiplier - filledSum;
    const emptyMultiplierSum = totalMultiplier - multiplierSum;
    
    const avgNeeded = requiredSum / emptyMultiplierSum;

    return {
      fields: emptyFields,
      avgNeeded: Math.max(0, Math.min(10, avgNeeded)).toFixed(1),
      isAchievable: avgNeeded >= 0 && avgNeeded <= 10,
    };
  };

  const currentScores = currentRecord?.scores || {
    tx1: null, tx2: null, tx3: null, tx4: null, tx5: null, gk: null, ck: null
  };
  const currentAverage = calculateAverage(currentScores);
  const suggestion = targetScore && parseFloat(targetScore) > 0 
    ? calculateSuggestion(currentScores, parseFloat(targetScore))
    : null;

  const hasAllRequired = currentScores.tx1 !== null && currentScores.tx2 !== null && 
                        currentScores.tx3 !== null && currentScores.gk !== null && 
                        currentScores.ck !== null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-background border-primary/10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Quản lý điểm số</h2>
            <p className="text-muted-foreground max-w-2xl">
              Nhập điểm từng cột, đặt mục tiêu và nhận gợi ý để đạt được kết quả mong muốn
            </p>
          </div>
          <TrendingUp className="w-10 h-10 text-primary" />
        </div>
      </Card>

      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <Label className="text-xs text-muted-foreground">Lớp</Label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRADES.map(g => (
                <SelectItem key={g} value={g}>Lớp {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-4">
          <Label className="text-xs text-muted-foreground">Học kỳ</Label>
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-4">
          <Label className="text-xs text-muted-foreground">Điểm mục tiêu</Label>
          <div className="flex gap-2 mt-2">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={targetScore}
              onChange={(e) => setTargetScore(e.target.value)}
              onBlur={(e) => handleTargetScoreChange(e.target.value)}
              placeholder="8.0"
              className="flex-1"
            />
            <Target className="w-9 h-9 text-primary" />
          </div>
        </Card>
      </div>

      {/* Subject Tabs */}
      <Tabs value={selectedSubject} onValueChange={setSelectedSubject}>
        <TabsList className="w-full flex-wrap h-auto justify-start gap-1">
          {SUBJECTS.map(subject => (
            <TabsTrigger key={subject} value={subject} className="min-w-[70px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {subject}
            </TabsTrigger>
          ))}
        </TabsList>

        {SUBJECTS.map(subject => (
          <TabsContent key={subject} value={subject} className="space-y-6 mt-6">
            {/* Status Badge */}
            {currentRecord?.is_completed && (
              <Card className="p-4 bg-success/10 border-success/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                    <div>
                      <p className="font-semibold text-success">Đã hoàn thành nhập điểm</p>
                      <p className="text-sm text-muted-foreground">Điểm trung bình: {currentAverage.toFixed(2)}</p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Edit className="w-4 h-4" />
                        Chỉnh sửa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận chỉnh sửa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn sửa đổi số điểm đã nhập!
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleEdit}>Xác nhận</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            )}

            {/* Score Inputs */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
              {/* TX Scores */}
              {(['tx1', 'tx2', 'tx3', 'tx4', 'tx5'] as const).map((field, idx) => (
                <Card key={field} className={`p-4 ${idx < 3 ? 'bg-primary/5 border-primary/20' : 'bg-secondary/30'}`}>
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    <span>TX{idx + 1}</span>
                    {idx < 3 && <Badge variant="destructive" className="text-[10px] h-4">Bắt buộc</Badge>}
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={currentScores[field] ?? ""}
                    onChange={(e) => handleScoreChange(field, e.target.value)}
                    placeholder={idx < 3 ? "Nhập điểm" : "Tùy chọn"}
                    className="mt-2 h-12 text-center text-lg font-semibold"
                    disabled={currentRecord?.is_completed}
                  />
                </Card>
              ))}

              {/* GK Score */}
              <Card className="p-4 bg-warning/10 border-warning/30">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Giữa kỳ</span>
                  <Badge variant="destructive" className="text-[10px] h-4">Bắt buộc</Badge>
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={currentScores.gk ?? ""}
                  onChange={(e) => handleScoreChange("gk", e.target.value)}
                  placeholder="Điểm GK"
                  className="mt-2 h-12 text-center text-lg font-semibold"
                  disabled={currentRecord?.is_completed}
                />
              </Card>

              {/* CK Score */}
              <Card className="p-4 bg-destructive/10 border-destructive/30">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Cuối kỳ</span>
                  <Badge variant="destructive" className="text-[10px] h-4">Bắt buộc</Badge>
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={currentScores.ck ?? ""}
                  onChange={(e) => handleScoreChange("ck", e.target.value)}
                  placeholder="Điểm CK"
                  className="mt-2 h-12 text-center text-lg font-semibold"
                  disabled={currentRecord?.is_completed}
                />
              </Card>
            </div>

            {/* Current Average */}
            {currentAverage > 0 && (
              <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Điểm trung bình hiện tại</p>
                    <p className="text-5xl font-bold">{currentAverage.toFixed(2)}</p>
                    {targetScore && parseFloat(targetScore) > 0 && (
                      <p className="text-sm mt-2">
                        Mục tiêu: <span className="font-semibold text-primary">{parseFloat(targetScore).toFixed(1)}</span>
                        {currentAverage >= parseFloat(targetScore) ? (
                          <span className="text-success ml-2">✓ Đã đạt!</span>
                        ) : (
                          <span className="text-warning ml-2">Còn {(parseFloat(targetScore) - currentAverage).toFixed(2)} điểm</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 ${
                    currentAverage >= 8 ? "border-success bg-success/10 text-success" :
                    currentAverage >= 6.5 ? "border-warning bg-warning/10 text-warning" :
                    "border-destructive bg-destructive/10 text-destructive"
                  }`}>
                    {currentAverage.toFixed(1)}
                  </div>
                </div>
              </Card>
            )}

            {/* Suggestion */}
            {suggestion && !currentRecord?.is_completed && (
              <Card className={`p-5 ${suggestion.isAchievable ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
                <div className="flex gap-4">
                  <Lightbulb className={`w-8 h-8 flex-shrink-0 ${suggestion.isAchievable ? 'text-primary' : 'text-destructive'}`} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {suggestion.isAchievable ? '💡 Gợi ý đạt mục tiêu' : '⚠️ Mục tiêu khó đạt được'}
                    </h3>
                    {suggestion.isAchievable ? (
                      <p className="text-sm text-muted-foreground">
                        Để đạt điểm trung bình <strong>{targetScore}</strong>, các cột còn lại{' '}
                        <strong className="text-primary">({suggestion.fields.join(", ")})</strong> cần đạt trung bình{' '}
                        <strong className="text-xl text-primary">{suggestion.avgNeeded} điểm</strong>
                      </p>
                    ) : (
                      <p className="text-sm text-destructive">
                        Với điểm hiện tại, bạn cần đạt trung bình <strong>{suggestion.avgNeeded} điểm</strong> cho các cột còn lại,
                        điều này có thể không khả thi. Hãy cân nhắc điều chỉnh mục tiêu!
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Complete Button */}
            {hasAllRequired && !currentRecord?.is_completed && (
              <div className="flex justify-end">
                <Button onClick={handleComplete} size="lg" className="gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Hoàn thành nhập điểm
                </Button>
              </div>
            )}

            {/* Info */}
            <Card className="p-4 bg-muted/30 border-border/50">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• TX1, TX2, TX3, Giữa kỳ và Cuối kỳ là bắt buộc</p>
                  <p>• TX4 và TX5 có thể để trống nếu không có</p>
                  <p>• Điểm được tự động lưu khi bạn nhập</p>
                  <p>• Công thức: (Tổng TX + GK×2 + CK×3) / (Số TX + 5)</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Chart */}
      <ScoreChart scores={allScores} grade={grade} semester={semester} />
    </div>
  );
};

export default ScoreManagement;