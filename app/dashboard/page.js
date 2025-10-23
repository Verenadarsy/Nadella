'use client'
import { useState, useEffect } from 'react'

export default function DashboardHome() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className={`rounded-xl p-8 mb-6 ${
        darkMode
          ? 'bg-gradient-to-r from-blue-600 to-blue-800'
          : 'bg-gradient-to-r from-blue-900 to-blue-700'
      } text-white shadow-xl`}>
        <h1 className="text-3xl font-bold mb-2">
          Welcome Back! 👋
        </h1>
        <p className="text-blue-100">
          Manage your CRM system efficiently from this dashboard
        </p>
      </div>

      {/* Dashboard Content */}
      <div className={`rounded-xl p-6 ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      } shadow-lg`}>
        <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Dashboard Overview
        </h2>
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Select a menu from the sidebar to get started managing your CRM system.
        </p>
      </div>
    </div>
  )
}