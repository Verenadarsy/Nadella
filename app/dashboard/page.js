// ===== DashboardHome.js =====
"use client";
import { useState, useEffect } from "react";
import FloatingChat from "./floatingchat";

export default function DashboardHome() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const updateDark = () => setDarkMode(document.documentElement.classList.contains("dark"));
    updateDark();
    const observer = new MutationObserver(updateDark);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className={`rounded-xl p-8 mb-6 ${darkMode ? "bg-gradient-to-r from-blue-600 to-blue-800" : "bg-gradient-to-r from-blue-900 to-blue-700"} text-white shadow-xl`}>
        <h1 className="text-3xl font-bold mb-2">Welcome Back! 👋</h1>
        <p className="text-blue-100">Manage your CRM system efficiently from this dashboard</p>
      </div>

      <div className={`rounded-xl p-6 ${darkMode ? "bg-slate-800" : "bg-white"} shadow-lg`}>
        <h2 className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-slate-900"}`}>Dashboard Overview</h2>
        <p className={`${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          Select a menu from the sidebar to get started managing your CRM system.
        </p>
      </div>

<<<<<<< HEAD
      {/* Floating Chat Imported Here */}
      <FloatingChat />
    </div>
  );
}
=======
      {/* ======== FLOATING AI CHAT ASSISTANT ======== */}
      <div className="fixed bottom-5 right-5 z-50 transition-all">
        {!chatOpen ? (
          <button
            onClick={() => setChatOpen(true)}
            className="bg-blue-600 text-white rounded-full w-16 h-16 shadow-lg text-3xl hover:bg-blue-700 flex items-center justify-center"
          >
            💬
          </button>
        ) : (
          <div
            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-[420px] h-[550px] flex flex-col ${
              darkMode ? 'border border-slate-700' : ''
            }`}
          >
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center rounded-t-2xl">
              <span className="font-semibold text-lg">Nadella AI Assistant</span>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white hover:text-gray-200"
              >
                ✖
              </button>
            </div>

            {/* Chat Body */}
            <div
              ref={chatBodyRef}
              className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-slate-900 space-y-3"
            >
              {messages.length === 0 && (
                <div className="bg-gray-200 dark:bg-slate-700 text-slate-800 dark:text-white p-3 rounded-lg max-w-[85%]">
                  👋 Halo! Aku <b>Nadella</b>, asisten virtualmu.
                  Ada yang bisa aku bantu hari ini?
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
                      {msg.content.split("\n").map((line, j) => {
                        const isList = line.trim().match(/^(\d+\.|-|\•)\s+/)
                        return (
                          <p
                            key={j}
                            className={`${
                              isList
                                ? "pl-4 before:content-['•'] before:mr-2 before:text-blue-500"
                                : ""
                            }`}
                          >
                            {line}
                          </p>
                        )
                      })}
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

            {/* Input */}
            <div className="p-3 flex gap-2 border-t dark:border-slate-700">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ketik pesan..."
                className="flex-1 border rounded-lg p-2 dark:bg-slate-800 dark:text-white dark:border-slate-600"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className={`px-4 rounded-lg transition-colors ${
                  loading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Kirim
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
>>>>>>> b1418cc7d0a48036789df417cbb18ff37a0e38fb
