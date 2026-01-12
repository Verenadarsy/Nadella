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

    const userText = input;

    setMessages((prev) => [...prev, { role: "user", content: userText }]);
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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to process the message." }
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!chatOpen ? (
        <button
          onClick={() => setChatOpen(true)}
          className="bg-blue-600 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-lg hover:bg-blue-700 flex items-center justify-center"
        >
          <Bot className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>
      ) : (
        <div
          className={`rounded-2xl shadow-2xl w-[95vw] sm:w-[420px] h-[80vh] sm:h-[550px] max-w-[420px] flex flex-col
          ${darkMode ? "bg-slate-800 border border-slate-700" : "bg-white"}`}
        >
          {/* HEADER */}
          <div
            className={`p-3 sm:p-4 flex justify-between items-center rounded-t-2xl
            ${darkMode ? "bg-blue-800 text-white" : "bg-blue-600 text-white"}`}
          >
            <span className="font-semibold text-base sm:text-lg">Nadella AI Assistant</span>
            <button onClick={() => setChatOpen(false)}>✖</button>
          </div>

          {/* CHAT BODY */}
          <div
            ref={chatBodyRef}
            className={`flex-1 p-3 sm:p-4 space-y-2 sm:space-y-3
            ${darkMode ? "bg-slate-900" : "bg-white"}`}
            style={{
              overflowY: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none"
            }}
          >
            {/* HIDE WEBKIT SCROLLBAR */}
            <style>{`
              div::-webkit-scrollbar { display: none; }
            `}</style>

            {messages.length === 0 && (
              <div
                className={`p-3 sm:p-4 rounded-lg max-w-[95%] sm:max-w-[85%] space-y-2 sm:space-y-3
                ${darkMode ? "bg-slate-700 text-white" : "bg-gray-200 text-slate-900"}`}
              >
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">👋</span>
                <p className="font-semibold text-sm sm:text-base">
                  Halo! Aku <span className="text-blue-500 dark:text-blue-300">Nadella</span> ada yang bisa aku bantu hari ini? <span className="text-lg sm:text-xl">🚀</span>
                </p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-sm sm:text-base">📌</span>
                  <div>
                    <p className="font-semibold mb-1 text-xs sm:text-sm">Apa yang bisa saya bantu:</p>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-xs sm:text-sm">
                      <li>Cari data pelanggan, produk, atau transaksi</li>
                      <li>Buat laporan PDF dengan filter tanggal</li>
                      <li>Analisis data penjualan dan aktivitas tim</li>
                      <li>Jawab pertanyaan berdasarkan database CRM</li>
                      <li>Pastikan tidak typo ya :D </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-sm sm:text-base">💡</span>
                  <div>
                    <p className="font-semibold mb-1 text-xs sm:text-sm">Contoh permintaan:</p>
                    <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
                      <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm ${darkMode ? 'bg-slate-600' : 'bg-gray-100'} font-mono`}>
                        rekap customer bulan ini
                      </div>
                      <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm ${darkMode ? 'bg-slate-600' : 'bg-gray-100'} font-mono`}>
                        cari customer bernama Budi
                      </div>
                      <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm ${darkMode ? 'bg-slate-600' : 'bg-gray-100'} font-mono`}>
                        buat laporan deal Desember 2025
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 sm:p-3 rounded-xl max-w-[85%] sm:max-w-[80%] break-words text-sm sm:text-base ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : darkMode
                    ? "bg-slate-700 text-white"
                    : "bg-gray-200 text-slate-900"
                }`}
              >
                {msg.content.includes("\n") ? (
                  <div className="space-y-0.5 sm:space-y-1">
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
              <div className="p-2 sm:p-3 rounded-xl max-w-[85%] sm:max-w-[80%] bg-slate-700 text-white w-fit animate-pulse text-sm sm:text-base">
                Nadella is typing...
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className="p-2 sm:p-3 flex gap-2 border-t dark:border-slate-700">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ketik pesan..."
              className={`flex-1 border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base
                ${darkMode ? "bg-slate-800 text-white border-slate-600" : "bg-white text-slate-800"}`}
              />
            <button
              onClick={sendMessage}
              disabled={loading}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white text-sm sm:text-base font-medium
                ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
