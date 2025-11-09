import { useState } from "react";
import Draggable from "react-draggable";
import { supabase } from "@/integrations/supabase/client";

export default function FloatingChat() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [inputText, setInputText] = useState("");

  async function sendMessage() {
    if (!inputText.trim()) return;

    const userMsg = inputText;
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInputText("");

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [{ role: "user", content: userMsg }] 
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to start stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
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
          } catch {
            // Ignore parsing errors
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { sender: "ai", text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại." }]);
    }
  }

  return (
    <>
      {/* Nút bong bóng chat */}
      {!isChatOpen && (
        <Draggable>
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 bg-[#FFDCDC] text-[#6B3F3F] w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-105 transition cursor-pointer select-none border border-[#F7B7B7] z-50"
          >
            💬
          </button>
        </Draggable>
      )}

      {/* Hộp Chat */}
      {isChatOpen && (
        <Draggable handle=".chat-header">
          <div className="fixed bottom-16 right-6 w-80 h-96 bg-[#FFF8F3] border border-[#F3D4D4] rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex flex-col select-none overflow-hidden z-50">
            
            {/* Header */}
            <div className="chat-header bg-[#FFE9E4] px-3 py-3 flex justify-between items-center border-b border-[#F3CBCB] cursor-move">
              <div className="flex items-center gap-2 text-[#6B3F3F] font-semibold">
                🌸 AI Chat
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-[#A07070] hover:text-[#6B3F3F] transition"
              >
                ✖
              </button>
            </div>

            {/* Message area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[75%] px-3 py-2 text-sm rounded-xl ${
                    msg.sender === "user"
                      ? "ml-auto bg-[#DCFCE7] text-[#22543D]"
                      : "mr-auto bg-white text-[#5A4A4A] border border-[#F0DADA]"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#F3CBCB] bg-[#FFF5F3]">
              <input
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#F2CACA] focus:outline-none focus:ring-2 focus:ring-[#FFB7C2]"
                placeholder="Nhập tin nhắn..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
            </div>
          </div>
        </Draggable>
      )}
    </>
  );
}
