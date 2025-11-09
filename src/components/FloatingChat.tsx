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
            className="fixed bottom-6 right-6 bg-[#f4c430] text-[#333] w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-105 hover:bg-[#e0b01d] transition cursor-pointer select-none z-50"
          >
            💬
          </button>
        </Draggable>
      )}

      {/* Hộp Chat */}
      {isChatOpen && (
        <Draggable handle=".chat-header">
          <div className="fixed bottom-16 right-6 w-80 h-[420px] bg-white/[0.35] backdrop-blur-[18px] border border-white/45 rounded-[22px] shadow-[0_8px_20px_rgba(0,0,0,0.12)] flex flex-col select-none overflow-hidden z-50 p-3">
            
            {/* Header */}
            <div className="chat-header flex items-center gap-2 font-semibold pb-2 cursor-move text-[#333]">
              <img src="https://i.ibb.co/Xx6zP2m/flower.png" alt="flower" className="w-[22px]" />
              <span>AI Chat</span>
              <button
                onClick={() => setIsChatOpen(false)}
                className="ml-auto text-[#666] hover:text-[#333] transition"
              >
                ✖
              </button>
            </div>

            {/* Message area */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[75%] px-3 py-2 text-sm leading-[1.36] rounded-[18px] ${
                    msg.sender === "user"
                      ? "ml-auto bg-white shadow-[0_2px_4px_rgba(0,0,0,0.06)]"
                      : "mr-auto bg-[#fff6d6] shadow-[0_2px_4px_rgba(0,0,0,0.08)]"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-1.5 mt-1.5">
              <input
                className="flex-1 rounded-full border border-[#ddd] px-3.5 py-2 text-sm outline-none"
                placeholder="Nhập tin nhắn..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="bg-[#f4c430] hover:bg-[#e0b01d] px-3.5 py-2 rounded-full font-bold transition"
              >
                ➤
              </button>
            </div>
          </div>
        </Draggable>
      )}
    </>
  );
}
