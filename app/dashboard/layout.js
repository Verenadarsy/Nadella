'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { showAlert } from '@/lib/sweetalert'
import {
  Sun, Moon, Menu, X, LogOut, ShieldCheck,
  Package, Building2, Users, UserPlus, Handshake,
  ClipboardList, Ticket, FileText, Wrench,
  Megaphone, UsersRound, MessageSquare, ChevronRight,
  LayoutDashboard, Globe
} from 'lucide-react'
import Image from "next/image";
import { useLanguage } from '@/lib/languageContext'


export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { language, toggleLanguage, t } = useLanguage()
  const texts = t.layout[language]
  const [role, setRole] = useState(null)
  const [email, setEmail] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tooltip, setTooltip] = useState({ show: false, text: '', top: 0 })

  useEffect(() => {
    // Baca dari localStorage dulu (yang di-set dari login page)
    const savedTheme = localStorage.getItem('darkMode')
    if (savedTheme !== null) {
      setDarkMode(savedTheme === 'true')
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(systemDark)
    }

    const roleCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('userRole='))
      ?.split('=')[1]

    const emailCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('userEmail='))
      ?.split('=')[1]

    const decodedEmail = emailCookie ? decodeURIComponent(emailCookie) : ''

    if (!roleCookie) {
      showAlert({
        icon: 'warning',
        title: texts.accessDenied,
        text: texts.mustLogin,
      }, savedTheme === 'true').then(() => router.push('/login'))
      return
    }

    setRole(roleCookie)
    setEmail(decodedEmail)
  }, [router])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', newMode.toString()) // SAVE KE LOCALSTORAGE
  }

  const handleLogout = () => {
    showAlert({
      title: texts.confirmLogout,
      text: texts.logoutConfirm,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: texts.yesLogout,
      cancelButtonText: texts.cancel
    }, darkMode).then((result) => {
      if (result.isConfirmed) {
        document.cookie = 'userRole=; Max-Age=0; path=/;'
        document.cookie = 'userEmail=; Max-Age=0; path=/;'
        showAlert({
          icon: 'success',
          title: texts.logoutSuccess,
          text: texts.seeYouAgain,
          showConfirmButton: false,
          timer: 1500
        }, darkMode).then(() => router.push('/login'))
      }
    })
  }

  const goTo = (path) => router.push(`/dashboard/${path}`)

  const handleMouseEnter = (e, text) => {
    if (!sidebarOpen) {
      const rect = e.currentTarget.getBoundingClientRect()
      setTooltip({
        show: true,
        text: text,
        top: rect.top + rect.height / 2
      })
    }
  }

  const handleMouseLeave = () => {
    setTooltip({ show: false, text: '', top: 0 })
  }

  const menuItems = [
    { icon: LayoutDashboard, label: texts.dashboard, path: '' },
    { icon: Package, label: texts.products, path: 'products' },
    { icon: Building2, label: texts.companies, path: 'companies' },
    { icon: Users, label: texts.customers, path: 'customers' },
    { icon: UserPlus, label: texts.leads, path: 'leads' },
    { icon: Handshake, label: texts.deals, path: 'deals' },
    { icon: ClipboardList, label: texts.activities, path: 'activities' },
    { icon: Ticket, label: texts.tickets, path: 'tickets' },
    { icon: FileText, label: texts.invoices, path: 'invoices' },
    { icon: Wrench, label: texts.services, path: 'services' },
    { icon: Megaphone, label: texts.campaigns, path: 'campaigns' },
    { icon: UsersRound, label: texts.teams, path: 'teams' },
    { icon: MessageSquare, label: texts.communications, path: 'communications' },
  ]

  const isActive = (path) => {
    if (pathname === '/dashboard' && path === '') return true
    return pathname === `/dashboard/${path}`
  }

  if (!role) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-slate-900' : 'bg-blue-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{texts.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Tooltip Fixed - PASTI SEJAJAR! */}
      {tooltip.show && !sidebarOpen && (
        <div
          className="fixed left-24 bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-lg z-50 whitespace-nowrap pointer-events-none transform -translate-y-1/2"
          style={{ top: `${tooltip.top}px` }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full transition-all duration-300 z-40 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-r`}>

        {/* Logo Section */}
        <div className={`h-16 flex items-center px-2 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          {sidebarOpen ? (
            <button
              onClick={() => router.push('/dashboard')}
              className={`
                flex items-end gap-2.5 px-3 py-2.5 rounded-lg w-full group transition-colors
                ${darkMode
                  ? "hover:bg-slate-700/40"
                  : "hover:bg-blue-50"
                }
              `}
            >
              <div className="relative w-9 h-9 flex-shrink-0">
                <Image
                  src="/favicon.png"
                  width={28}
                  height={28}
                  alt="logo"
                  className={`rounded-sm transition-all ${darkMode ? "brightness-0 invert" : ""}`}
                />
              </div>

              <span
                className={`
                  font-bold text-xl transition-colors leading-none pb-[3px]
                  ${darkMode
                    ? "text-blue-600 group-hover:text-blue-500"
                    : "text-blue-900 group-hover:text-blue-700"
                  }
                `}
              >
                Nadella Tech
              </span>
            </button>

          ) : (
            <button
              onClick={() => router.push('/dashboard')}
              onMouseEnter={(e) => handleMouseEnter(e, 'Nadella Tech')}
              onMouseLeave={handleMouseLeave}
              className="p-2 rounded-lg mx-auto hover:bg-slate-700/50 transition-colors"
            >
              <div className="relative w-9 h-9">
                <Image
                  src="/favicon.png"
                  width={28}
                  height={28}
                  alt="logo"
                  className={`rounded-sm transition-all ${darkMode ? 'brightness-0 invert' : ''}`}
                />
              </div>
            </button>
          )}
        </div>

        {/* User Info */}
        {sidebarOpen ? (
          <div className={`p-4 border-b ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-blue-600' : 'bg-blue-900'
              }`}>
                <span className="text-white font-semibold text-sm">
                  {email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {email}
                </p>
                <p className={`text-xs flex items-center gap-1 ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <ShieldCheck className="w-3 h-3" />
                  {role === 'superadmin' ? texts.superAdmin : texts.admin}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className={`p-4 border-b flex justify-center ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-blue-600' : 'bg-blue-900'
            }`}>
              <span className="text-white font-semibold text-sm">
                {email.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <nav className="p-2 overflow-y-auto h-[calc(100vh-200px)] custom-scrollbar">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => goTo(item.path)}
              onMouseEnter={(e) => handleMouseEnter(e, item.label)}
              onMouseLeave={handleMouseLeave}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 group ${
                isActive(item.path)
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-900 text-white'
                  : darkMode
                    ? 'hover:bg-slate-700 text-slate-300 hover:text-white'
                    : 'hover:bg-blue-50 text-slate-700 hover:text-blue-900'
              } ${!sidebarOpen ? 'justify-center' : ''}`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                isActive(item.path)
                  ? 'text-white'
                  : darkMode ? 'group-hover:text-blue-400' : 'group-hover:text-blue-600'
              }`} />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                  <ChevronRight className={`w-4 h-4 ${
                    isActive(item.path) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  } transition-opacity`} />
                </>
              )}
            </button>
          ))}

          {/* Manage Admins - Only for Superadmin */}
          {role === 'superadmin' && (
            <button
              onClick={() => goTo('manage-admins')}
              onMouseEnter={(e) => handleMouseEnter(e, texts.manageAdmins)}
              onMouseLeave={handleMouseLeave}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 group ${
                isActive('manage-admins')
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-900 text-white'
                  : darkMode
                    ? 'bg-blue-600/50 hover:bg-blue-700 text-white'
                    : 'bg-blue-900/90 hover:bg-blue-800 text-white'
              } ${!sidebarOpen ? 'justify-center' : ''}`}
            >
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">{texts.manageAdmins}</span>
                  <ChevronRight className={`w-4 h-4 ${
                    isActive('manage-admins') ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  } transition-opacity`} />
                </>
              )}
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            onMouseEnter={(e) => handleMouseEnter(e, texts.logout)}
            onMouseLeave={handleMouseLeave}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mt-4 transition-all duration-200 ${
              darkMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            } ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="flex-1 text-left text-sm font-medium">{texts.logout}</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className={`h-16 border-b ${
          darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
        } flex items-center justify-between px-4 sticky top-0 z-30`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-slate-700'
            }`}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-1">
            <div className={`
              flex items-center gap-1 p-1.5 rounded-full backdrop-blur-lg
              transition-all duration-300 shadow-lg
              ${darkMode
                ? 'bg-slate-700/90 border border-slate-600/50'
                : 'bg-white border border-gray-200'
              }
            `}>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className={`
                  relative px-3 py-2 rounded-full font-semibold text-sm
                  transition-all duration-300 flex items-center gap-2
                  ${darkMode
                    ? 'text-white hover:bg-slate-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
                  }
                `}
                aria-label="Toggle language"
              >
                <Globe className="w-4 h-4" />
                <span>{language === 'en' ? 'ID' : 'EN'}</span>
              </button>

              {/* Separator */}
              <div className={`w-px h-6 ${darkMode ? 'bg-slate-600' : 'bg-gray-300'}`} />

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`
                  relative p-2.5 rounded-full
                  transition-all duration-300
                  ${darkMode
                    ? 'text-yellow-300 hover:bg-slate-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
                  }
                `}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main>
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}