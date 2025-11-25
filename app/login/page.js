'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import bcrypt from 'bcryptjs'
import { showAlert } from '@/lib/sweetalert'
import { Sun, Moon, Eye, EyeOff, Lock, Mail, Globe } from 'lucide-react'
import { useLanguage } from '@/lib/languageContext'

export default function LoginPage() {
  const router = useRouter()
  const { language, toggleLanguage, t } = useLanguage()
  const texts = t.login[language]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check for dark mode preference
    const savedTheme = localStorage.getItem('darkMode')
    if (savedTheme !== null) {
      setDarkMode(savedTheme === 'true')
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(systemDark)
    }

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('auth') === 'required') {
      showAlert({
        icon: 'warning',
        title: texts.accessDenied,
        text: texts.mustLogin,
        confirmButtonText: texts.okay,
      }, savedTheme === 'true')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', newMode.toString())
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (userError || !user) {
        showAlert({
          icon: 'error',
          title: texts.userNotFound,
          text: texts.checkEmail,
        }, darkMode)
        setIsLoading(false)
        return
      }

      const match = bcrypt.compareSync(password, user.password_hash)
      if (!match) {
        showAlert({
          icon: 'error',
          title: texts.incorrectPassword,
          text: texts.tryAgain,
        }, darkMode)
        setIsLoading(false)
        return
      }

      document.cookie = `userRole=${encodeURIComponent(user.role)}; path=/`
      document.cookie = `userEmail=${encodeURIComponent(user.email)}; path=/`

      await showAlert({
        icon: 'success',
        title: texts.loginSuccessful,
        text: `${texts.welcome}, ${user.name}`,
        showConfirmButton: false,
        timer: 1200,
      }, darkMode)

      router.push('/dashboard')
    } catch (err) {
      showAlert({
        icon: 'error',
        title: texts.errorOccurred,
        text: texts.tryAgain,
      }, darkMode)
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${
      darkMode
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'
    }`}>
      {/* Dark Mode + Language Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <div className={`
          flex items-center gap-1 p-1.5 rounded-full backdrop-blur-lg
          transition-all duration-300 shadow-lg
          ${darkMode
            ? 'bg-slate-800/90 border border-slate-700/50'
            : 'bg-white/90 border border-white/20'
          }
        `}>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className={`
              relative px-3 py-2 rounded-full font-semibold text-sm
              transition-all duration-300 flex items-center gap-2
              ${darkMode
                ? 'text-white hover:bg-slate-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }
            `}
            aria-label="Toggle language"
          >
            <Globe className="w-4 h-4" />
            <span>{language === 'en' ? 'ID' : 'EN'}</span>
          </button>

          {/* Separator */}
          <div className={`w-px h-6 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`
              relative p-2.5 rounded-full
              transition-all duration-300
              ${darkMode
                ? 'text-yellow-300 hover:bg-slate-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }
            `}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Login Card */}
      <div className={`w-full max-w-md transition-all duration-300 ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      } rounded-2xl shadow-2xl p-8`}>

        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            darkMode ? 'bg-blue-600' : 'bg-blue-900'
          }`}>
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            {texts.welcomeBack}
          </h1>
          <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {texts.pleaseLogin}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {texts.email}
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <input
                id="email"
                type="email"
                placeholder={texts.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-colors duration-200 ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-600'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-900 focus:bg-blue-50'
                } outline-none`}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {texts.password}
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={texts.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full pl-11 pr-12 py-3 rounded-lg border-2 transition-colors duration-200 ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:bg-slate-600'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-900 focus:bg-blue-50'
                } outline-none`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                  darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                } transition-colors`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : 'bg-blue-900 hover:bg-blue-800 active:bg-blue-950'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {texts.loading}
              </span>
            ) : (
              texts.loginButton
            )}
          </button>
        </form>


      </div>
    </div>
  )
}