import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, CheckCircle2, XCircle, Loader2, Trophy, RotateCcw, History } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

const SUBJECTS = [
  "Toán", "Vật lý", "Hóa học", "Văn", "Anh văn",
  "Sinh học", "Lịch sử", "Địa lý", "GDCD"
];

const GRADES = ["10", "11", "12"];

interface Question {
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options?: string[];
  correctAnswer: number | string;
  explanation: string;
}

interface QuizData {
  questions: Question[];
}

interface QuizResult {
  id: string;
  subject: string;
  grade: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

const QuizTest = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState("10");
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | string)[]>([]);
  const [shortAnswers, setShortAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<QuizResult[]>([]);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  const fetchHistory = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching history:", error);
      return;
    }

    setHistory(data || []);
  };

  const handleGenerateQuiz = async () => {
    if (!subject || !grade) {
      toast.error("Vui lòng chọn môn học và khối");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { 
          subject, 
          grade, 
          topic: topic || undefined,
          numQuestions: parseInt(numQuestions) || 10
        }
      });

      if (error) throw error;

      setQuiz(data);
      setCurrentQuestion(0);
      setSelectedAnswers([]);
      setShortAnswers([]);
      setShowResults(false);
      toast.success("Đã tạo bài kiểm tra!");
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Không thể tạo bài kiểm tra. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (answer: number | string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleShortAnswerChange = (text: string) => {
    const newAnswers = [...shortAnswers];
    newAnswers[currentQuestion] = text;
    setShortAnswers(newAnswers);
    handleAnswerSelect(text);
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz || !user) return;

    let score = 0;
    selectedAnswers.forEach((answer, idx) => {
      const q = quiz.questions[idx];
      if (q.type === "short_answer") {
        const userAnswer = (answer as string || "").trim().toLowerCase();
        const correctAnswer = (q.correctAnswer as string || "").trim().toLowerCase();
        if (userAnswer === correctAnswer) score++;
      } else if (answer === q.correctAnswer) {
        score++;
      }
    });

    // Save result to database
    const insertData: Database['public']['Tables']['quiz_results']['Insert'] = {
      user_id: user.id,
      subject,
      grade,
      score: score,
      total_questions: quiz.questions.length,
      questions_data: quiz as any
    };

    const { error } = await supabase
      .from('quiz_results')
      .insert(insertData);

    if (error) {
      console.error("Error saving quiz result:", error);
    }

    setShowResults(true);
    toast.success(`Hoàn thành! Bạn đạt ${score}/${quiz.questions.length} điểm`);
  };

  const handleRetry = () => {
    setQuiz(null);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShortAnswers([]);
    setShowResults(false);
  };

  const calculateScore = (): number => {
    if (!quiz) return 0;
    let score = 0;
    selectedAnswers.forEach((answer, idx) => {
      const q = quiz.questions[idx];
      if (q.type === "short_answer") {
        const userAnswer = (answer as string || "").trim().toLowerCase();
        const correctAnswer = (q.correctAnswer as string || "").trim().toLowerCase();
        if (userAnswer === correctAnswer) score++;
      } else if (answer === q.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  const currentQ = quiz?.questions[currentQuestion];

  if (showHistory) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <History className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Lịch sử bài kiểm tra</h2>
                <p className="text-sm text-muted-foreground">
                  Xem lại các bài kiểm tra đã làm
                </p>
              </div>
            </div>
            <Button onClick={() => setShowHistory(false)} variant="outline">
              Quay lại
            </Button>
          </div>

          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Chưa có lịch sử bài kiểm tra
              </p>
            ) : (
              history.map((result) => (
                <Card key={result.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{result.subject} - Khối {result.grade}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(result.completed_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <Badge 
                      variant={result.score / result.total_questions >= 0.8 ? "default" : 
                               result.score / result.total_questions >= 0.5 ? "secondary" : "destructive"}
                      className="text-lg px-4 py-2"
                    >
                      {result.score}/{result.total_questions}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Bài kiểm tra AI</h2>
                <p className="text-sm text-muted-foreground">
                  AI tự động tạo câu hỏi phù hợp với trình độ
                </p>
              </div>
            </div>
            <Button onClick={() => setShowHistory(true)} variant="outline" className="gap-2">
              <History className="w-4 h-4" />
              Lịch sử
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Môn học *</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn môn học" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Khối *</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khối" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map(g => (
                      <SelectItem key={g} value={g}>Khối {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Chủ đề (tùy chọn)</Label>
              <Input 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="VD: Phương trình bậc 2, Định luật Newton..."
              />
            </div>

            <div className="space-y-2">
              <Label>Số câu hỏi</Label>
              <Select value={numQuestions} onValueChange={setNumQuestions}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 câu</SelectItem>
                  <SelectItem value="10">10 câu</SelectItem>
                  <SelectItem value="15">15 câu</SelectItem>
                  <SelectItem value="20">20 câu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerateQuiz} 
              disabled={isGenerating}
              size="lg"
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tạo bài kiểm tra...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Tạo bài kiểm tra
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
          <h3 className="font-semibold mb-2">💡 Mẹo làm bài hiệu quả</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Đọc kỹ câu hỏi trước khi chọn đáp án</li>
            <li>• Có thể quay lại câu trước để kiểm tra lại</li>
            <li>• Sau khi nộp bài sẽ có giải thích chi tiết cho từng câu</li>
          </ul>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = quiz.questions.length > 0 ? (score / quiz.questions.length) * 100 : 0;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent border-primary/20">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Hoàn thành bài kiểm tra!</h2>
              <p className="text-xl">
                Bạn đạt <span className="font-bold text-primary">{score}/{quiz.questions.length}</span> điểm
              </p>
              <p className="text-muted-foreground">
                {percentage >= 80 ? "Xuất sắc! 🎉" : 
                 percentage >= 50 ? "Khá tốt! 👍" : 
                 "Cố gắng hơn nhé! 💪"}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {quiz.questions.map((q, idx) => {
            const userAnswer = selectedAnswers[idx];
            let isCorrect = false;
            
            if (q.type === "short_answer") {
              const userAns = (userAnswer as string || "").trim().toLowerCase();
              const correctAns = (q.correctAnswer as string || "").trim().toLowerCase();
              isCorrect = userAns === correctAns;
            } else {
              isCorrect = userAnswer === q.correctAnswer;
            }

            return (
              <Card key={idx} className={`p-4 ${isCorrect ? 'border-success' : 'border-destructive'}`}>
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-success mt-1" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {q.type === "multiple_choice" && "Trắc nghiệm"}
                        {q.type === "true_false" && "Đúng/Sai"}
                        {q.type === "short_answer" && "Trả lời ngắn"}
                      </Badge>
                    </div>
                    <p className="font-semibold mb-2">Câu {idx + 1}: {q.question}</p>
                    
                    {q.type === "multiple_choice" && q.options && (
                      <div className="space-y-2">
                        {q.options.map((option, optIdx) => (
                          <div 
                            key={optIdx}
                            className={`p-2 rounded-lg ${
                              optIdx === q.correctAnswer ? 'bg-success/20 border border-success' :
                              optIdx === userAnswer ? 'bg-destructive/20 border border-destructive' :
                              'bg-muted/30'
                            }`}
                          >
                            {option}
                            {optIdx === q.correctAnswer && " ✓"}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {q.type === "true_false" && (
                      <div className="space-y-2">
                        <div className={`p-2 rounded-lg ${
                          q.correctAnswer === "true" ? 'bg-success/20 border border-success' :
                          userAnswer === "true" ? 'bg-destructive/20 border border-destructive' :
                          'bg-muted/30'
                        }`}>
                          ✓ Đúng {q.correctAnswer === "true" && " ✓"}
                        </div>
                        <div className={`p-2 rounded-lg ${
                          q.correctAnswer === "false" ? 'bg-success/20 border border-success' :
                          userAnswer === "false" ? 'bg-destructive/20 border border-destructive' :
                          'bg-muted/30'
                        }`}>
                          ✗ Sai {q.correctAnswer === "false" && " ✓"}
                        </div>
                      </div>
                    )}
                    
                    {q.type === "short_answer" && (
                      <div className="space-y-2">
                        <div className="p-2 rounded-lg bg-muted/30">
                          <span className="text-sm font-medium">Câu trả lời của bạn: </span>
                          <span className={isCorrect ? "text-success" : "text-destructive"}>
                            {userAnswer as string || "(Không trả lời)"}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="p-2 rounded-lg bg-success/20 border border-success">
                            <span className="text-sm font-medium">Đáp án đúng: </span>
                            {q.correctAnswer as string}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <p className="text-sm font-medium mb-1">Giải thích:</p>
                      <p className="text-sm text-muted-foreground">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleRetry} variant="outline" className="gap-2 flex-1">
            <RotateCcw className="w-4 h-4" />
            Làm bài mới
          </Button>
          <Button onClick={() => setShowHistory(true)} variant="outline" className="gap-2 flex-1">
            <History className="w-4 h-4" />
            Xem lịch sử
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">{subject} - Khối {grade}</h2>
            <p className="text-sm text-muted-foreground">
              Câu {currentQuestion + 1} / {quiz.questions.length}
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {selectedAnswers.filter(a => a !== undefined).length} / {quiz.questions.length}
          </Badge>
        </div>

        <Progress value={((currentQuestion + 1) / quiz.questions.length) * 100} className="mb-6" />

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">
              {currentQ?.type === "multiple_choice" && "Trắc nghiệm"}
              {currentQ?.type === "true_false" && "Đúng/Sai"}
              {currentQ?.type === "short_answer" && "Trả lời ngắn"}
            </Badge>
          </div>
          
          <p className="text-lg font-medium">{currentQ?.question}</p>
          
          <div className="space-y-2">
            {currentQ?.type === "multiple_choice" && currentQ.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswers[currentQuestion] === idx
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="font-medium mr-3">{String.fromCharCode(65 + idx)}.</span>
                {option}
              </button>
            ))}
            
            {currentQ?.type === "true_false" && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnswerSelect("true")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedAnswers[currentQuestion] === "true"
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium">✓ Đúng</span>
                </button>
                <button
                  onClick={() => handleAnswerSelect("false")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedAnswers[currentQuestion] === "false"
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium">✗ Sai</span>
                </button>
              </div>
            )}
            
            {currentQ?.type === "short_answer" && (
              <Input
                value={shortAnswers[currentQuestion] || ""}
                onChange={(e) => handleShortAnswerChange(e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
                className="text-base p-4"
              />
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button 
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            variant="outline"
            className="flex-1"
          >
            Câu trước
          </Button>
          
          {currentQuestion < quiz.questions.length - 1 ? (
            <Button 
              onClick={handleNext}
              className="flex-1"
            >
              Câu tiếp
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={selectedAnswers.filter(a => a !== undefined).length < quiz.questions.length}
              className="flex-1 gap-2"
            >
              <Trophy className="w-4 h-4" />
              Nộp bài
            </Button>
          )}
        </div>

        {selectedAnswers.filter(a => a !== undefined).length < quiz.questions.length && 
         currentQuestion === quiz.questions.length - 1 && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            Vui lòng trả lời tất cả các câu hỏi trước khi nộp bài
          </p>
        )}
      </Card>
    </div>
  );
};

export default QuizTest;
