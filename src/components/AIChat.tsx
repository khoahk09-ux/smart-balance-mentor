import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Xin chào! Tôi là AI trợ giúp học tập của bạn. Tôi có thể giúp bạn:\n\n• Giải đáp thắc mắc về bài tập\n• Tạo bài kiểm tra củng cố kiến thức\n• Phân tích điểm số và đưa ra gợi ý học tập\n• Giải thích các khái niệm khó hiểu\n\nBạn cần giúp gì hôm nay?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Simulate AI response (will be replaced with real AI later)
    setTimeout(() => {
      const responses = [
        "Đây là một câu hỏi hay! Để giải quyết vấn đề này, chúng ta cần phân tích từng bước...",
        "Tôi hiểu vấn đề của bạn. Hãy cùng tôi tìm hiểu chi tiết nhé...",
        "Câu hỏi thú vị! Chúng ta có thể tiếp cận vấn đề này theo nhiều cách...",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages(prev => [...prev, { role: "assistant", content: randomResponse }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Trợ giúp học tập</h2>
            <p className="text-sm text-muted-foreground">
              Hỏi đáp, giải bài tập và tạo bài kiểm tra
            </p>
          </div>
        </div>

        {/* Chat Messages */}
        <Card className="bg-muted/30 border-border/50">
          <ScrollArea className="h-[500px] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Input */}
        <div className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="lg"
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Gửi
          </Button>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
        <h3 className="font-semibold mb-2">💡 Mẹo sử dụng AI hiệu quả</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Mô tả vấn đề càng chi tiết, AI sẽ giúp bạn càng tốt</li>
          <li>• Có thể yêu cầu AI tạo bài kiểm tra từ nội dung bạn đã học</li>
          <li>• Hỏi AI về các khái niệm khó hiểu để được giải thích dễ dàng hơn</li>
        </ul>
      </Card>
    </div>
  );
};

export default AIChat;
