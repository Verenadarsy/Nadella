'use client'
import { useState, useEffect, useRef } from 'react'

export default function DashboardHome() {
  const [darkMode, setDarkMode] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const chatBodyRef = useRef(null)

  // === CEK DARK MODE ===
  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  // === AUTO SCROLL KE BAWAH SAAT ADA PESAN BARU ===
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [messages])

  // === CEK & OTOMASI DOWNLOAD PDF ===
  useEffect(() => {
    if (messages.length === 0) return
    const lastMsg = messages[messages.length - 1]

    // Hanya proses jika pesan terakhir berasal dari asisten (AI)
    if (lastMsg.role !== 'assistant') return

    // Pastikan content adalah string sebelum mencari URL
    const text = String(lastMsg.content || '')
    // Regex untuk mencari URL yang diakhiri dengan .pdf (http atau https, case-insensitive)
    const pdfMatch = text.match(/https?:\/\/[^\s]+\.pdf/i)

    if (pdfMatch) {
      const pdfUrl = pdfMatch[0]

      try {
        // Logika download: Buat link temporer, buka di tab baru dan klik
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = 'laporan-otomatis.pdf' // Beri nama file default
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        console.log('✅ Auto-download PDF dari chat:', pdfUrl)
      } catch (err) {
        console.error('Gagal auto-download PDF:', err)
      }
    }
  }, [messages])

  // === FUNGSI KIRIM PESAN KE API ===
  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal memproses pesan')
      }

      const data = await res.json()
      const reply = data.reply || 'Maaf, aku tidak bisa menjawab sekarang 😅'

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply },
      ])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Maaf, terjadi kesalahan saat menghubungi server.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      {/* ======== WELCOME BANNER ======== */}
      <div
        className={`rounded-xl p-8 mb-6 ${
          darkMode
            ? 'bg-gradient-to-r from-blue-600 to-blue-800'
            : 'bg-gradient-to-r from-blue-900 to-blue-700'
        } text-white shadow-xl`}
      >
        <h1 className="text-3xl font-bold mb-2">Welcome Back! 👋</h1>
        <p className="text-blue-100">
          Manage your CRM system efficiently from this dashboard
        </p>
      </div>

      {/* ======== DASHBOARD CONTENT ======== */}
      <div
        className={`rounded-xl p-6 ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        } shadow-lg`}
      >
        <h2
          className={`text-xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          Dashboard Overview
        </h2>
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Select a menu from the sidebar to get started managing your CRM system.
        </p>
      </div>

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