// ===== FloatingChat.js =====
"use client";
import { useState, useEffect, useRef } from "react";
import { Bot } from "lucide-react";

export default function FloatingChat() {
  const [darkMode, setDarkMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatBodyRef = useRef(null);

  // AUTO DETECT DARK MODE
  useEffect(() => {
    const updateDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    };
    updateDarkMode();
    const observer = new MutationObserver(updateDarkMode);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // AUTO SCROLL
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // AUTO DOWNLOAD PDF
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant") return;

    const text = String(last.content || "");
    const match = text.match(/https?:\/\/[^\s]+\.pdf/i);

    if (match) {
      const link = document.createElement("a");
      link.href = match[0];
      link.target = "_blank";
      link.download = "file.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [messages]);

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    const userText = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });

      const data = await res.json();
      const reply = data.reply || "Maaf, aku tidak bisa menjawab sekarang.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Gagal memproses pesan." }]);
    }

    setLoading(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!chatOpen ? (
        <button
          onClick={() => setChatOpen(true)}
          className="bg-blue-600 text-white rounded-full w-16 h-16 shadow-lg text-3xl hover:bg-blue-700 flex items-center justify-center"
        >
            <Bot />
        </button>
      ) : (
        <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-[420px] h-[550px] flex flex-col ${darkMode ? "border border-slate-700" : ""}`}>
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-2xl">
            <span className="font-semibold text-lg">Nadella AI Assistant</span>
            <button onClick={() => setChatOpen(false)}>✖</button>
          </div>

          <div ref={chatBodyRef} className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-slate-900 space-y-3">
            {messages.length === 0 && (
              <div className="bg-gray-200 dark:bg-slate-700 text-slate-800 dark:text-white p-3 rounded-lg max-w-[85%]">
                👋 Halo! Aku <b>Nadella</b>. Ada yang bisa aku bantu?
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl max-w-[80%] break-words ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : darkMode
                    ? "bg-slate-700 text-white"
                    : "bg-gray-200 text-slate-800"
                }`}
              >
                {msg.content.includes("\n") ? (
                  <div className="space-y-1">
                    {msg.content.split("\n").map((line, j) => (
                      <p key={j}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            ))}

            {loading && (
              <div className="p-3 rounded-xl max-w-[80%] bg-slate-700 text-white w-fit animate-pulse">
                Nadella sedang mengetik...
              </div>
            )}
          </div>

          <div className="p-3 flex gap-2 border-t dark:border-slate-700">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ketik pesan..."
              className="flex-1 border rounded-lg p-2 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className={`px-4 rounded-lg ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} text-white`}
            >
              Kirim
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


