'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { showAlert } from '@/lib/sweetalert'
import {
  Sun, Moon, Menu, X, LogOut, ShieldCheck,
  Package, Building2, Users, UserPlus, Handshake,
  ClipboardList, Ticket, FileText, Wrench,
  Megaphone, UsersRound, MessageSquare, ChevronRight,
  LayoutDashboard
} from 'lucide-react'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
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
        title: 'Access Denied',
        text: 'Yiou must login first!',
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
      title: 'Confirm Logout',
      text: 'Are you sure you want to log out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel'
    }, darkMode).then((result) => {
      if (result.isConfirmed) {
        document.cookie = 'userRole=; Max-Age=0; path=/;'
        document.cookie = 'userEmail=; Max-Age=0; path=/;'
        showAlert({
          icon: 'success',
          title: 'Logout successful!',
          text: 'See you again!',
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
    { icon: LayoutDashboard, label: 'Dashboard', path: '' },
    { icon: Package, label: 'Products', path: 'products' },
    { icon: Building2, label: 'Companies', path: 'companies' },
    { icon: Users, label: 'Customers', path: 'customers' },
    { icon: UserPlus, label: 'Leads', path: 'leads' },
    { icon: Handshake, label: 'Deals', path: 'deals' },
    { icon: ClipboardList, label: 'Activities', path: 'activities' },
    { icon: Ticket, label: 'Tickets', path: 'tickets' },
    { icon: FileText, label: 'Invoices', path: 'invoices' },
    { icon: Wrench, label: 'Services', path: 'services' },
    { icon: Megaphone, label: 'Campaigns', path: 'campaigns' },
    { icon: UsersRound, label: 'Teams', path: 'teams' },
    { icon: MessageSquare, label: 'Communications', path: 'communications' },
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
          <p className={`mt-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Loading...</p>
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
        <div className={`h-16 flex items-center justify-center px-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          {sidebarOpen ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 group"
            >
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-600' : 'bg-blue-900'} group-hover:opacity-90`}>
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-900'} group-hover:text-blue-500`}>
                CRM System
              </span>
            </button>
          ) : (
            <button
              onClick={() => router.push('/dashboard')}
              className={`p-2 rounded-lg ${darkMode ? 'bg-blue-600' : 'bg-blue-900'} hover:opacity-90`}
            >
              <LayoutDashboard className="w-5 h-5 text-white" />
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
                  {role === 'superadmin' ? 'Super Admin' : 'Admin'}
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
              onMouseEnter={(e) => handleMouseEnter(e, 'Manage Admins')}
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
                  <span className="flex-1 text-left text-sm font-medium">Manage Admins</span>
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
            onMouseEnter={(e) => handleMouseEnter(e, 'Logout')}
            onMouseLeave={handleMouseLeave}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mt-4 transition-all duration-200 ${
              darkMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            } ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="flex-1 text-left text-sm font-medium">Logout</span>}
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

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'bg-slate-700 text-yellow-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
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