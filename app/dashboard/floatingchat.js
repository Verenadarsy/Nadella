// ===== FloatingChat.js =====
"use client";
import { useState, useEffect, useRef } from "react";
import {
  Bot, X, Send, Sparkles, Search, FileText,
  TrendingUp, Database, Calendar
} from "lucide-react";

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
            <button
              onClick={() => setChatOpen(false)}
              className="hover:bg-white/20 rounded-lg p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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
              <div className="space-y-3 sm:space-y-4">
                {/* Header Welcome */}
                <div
                  className={`p-4 rounded-xl ${
                    darkMode
                      ? "bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-700/50"
                      : "bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      darkMode ? "bg-blue-600/20" : "bg-blue-100"
                    }`}>
                      <Sparkles className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        darkMode ? "text-blue-400" : "text-blue-600"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm sm:text-base mb-1 ${
                        darkMode ? "text-white" : "text-slate-900"
                      }`}>
                        Halo! Aku <span className="text-blue-500 dark:text-blue-400">Nadella</span>
                      </p>
                      <p className={`text-xs sm:text-sm ${
                        darkMode ? "text-slate-300" : "text-slate-700"
                      }`}>
                        Asisten AI CRM-mu. Ada yang bisa aku bantu hari ini?
                      </p>
                    </div>
                  </div>
                </div>

                {/* Capabilities Card */}
                <div
                  className={`p-3 sm:p-4 rounded-xl ${
                    darkMode ? "bg-slate-700/50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Database className={`w-4 h-4 ${
                      darkMode ? "text-blue-400" : "text-blue-600"
                    }`} />
                    <p className={`font-semibold text-xs sm:text-sm ${
                      darkMode ? "text-white" : "text-slate-900"
                    }`}>
                      Yang bisa aku lakukan:
                    </p>
                  </div>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    {[
                      { icon: Search, text: "Cari data pelanggan, produk, atau transaksi" },
                      { icon: FileText, text: "Buat laporan PDF dengan filter tanggal" },
                      { icon: TrendingUp, text: "Analisis data penjualan dan aktivitas tim" },
                      { icon: Database, text: "Jawab pertanyaan berdasarkan database CRM" }
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <item.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 ${
                          darkMode ? "text-blue-400" : "text-blue-600"
                        }`} />
                        <span className={darkMode ? "text-slate-300" : "text-slate-700"}>
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Example Queries Card */}
                <div
                  className={`p-3 sm:p-4 rounded-xl ${
                    darkMode ? "bg-slate-700/50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Calendar className={`w-4 h-4 ${
                      darkMode ? "text-purple-400" : "text-purple-600"
                    }`} />
                    <p className={`font-semibold text-xs sm:text-sm ${
                      darkMode ? "text-white" : "text-slate-900"
                    }`}>
                      Contoh pertanyaan:
                    </p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    {[
                      "rekap customer bulan ini",
                      "cari customer bernama Budi",
                      "buat laporan deal Desember 2025"
                    ].map((query, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(query)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm font-mono transition-colors ${
                          darkMode
                            ? "bg-slate-600 hover:bg-slate-500 text-slate-200"
                            : "bg-white hover:bg-gray-100 text-slate-700 border border-gray-200"
                        }`}
                      >
                        {query}
                      </button>
                    ))}
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
              <div className={`p-2 sm:p-3 rounded-xl max-w-[85%] sm:max-w-[80%] w-fit flex items-center gap-2 ${
                darkMode ? "bg-slate-700 text-white" : "bg-gray-200 text-slate-900"
              }`}>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm sm:text-base">Nadella is typing...</span>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className={`p-2 sm:p-3 flex gap-2 border-t ${
            darkMode ? "border-slate-700 bg-slate-800" : "border-gray-200 bg-gray-50"
          }`}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
              placeholder="Ketik Pesan..."
              disabled={loading}
              className={`flex-1 border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base outline-none transition-colors ${
                loading
                  ? "cursor-not-allowed opacity-50"
                  : "focus:ring-2 focus:ring-blue-500"
              } ${
                darkMode
                  ? "bg-slate-800 text-white border-slate-600 placeholder-slate-400"
                  : "bg-white text-slate-800 border-gray-300 placeholder-slate-400"
              }`}
            />
              <button
                onClick={sendMessage}
                disabled={loading}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white text-sm sm:text-base font-medium transition-colors flex items-center gap-1.5 sm:gap-2 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
          </div>
        </div>
      )}
    </div>
  );
}
