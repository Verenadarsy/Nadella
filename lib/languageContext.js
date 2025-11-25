'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const translations = {
// Login Page ONLY
login: {
    en: {
    welcomeBack: 'Welcome Back',
    pleaseLogin: 'Please login to continue',
    email: 'Email',
    emailPlaceholder: 'name@example.com',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    loginButton: 'Login',
    loading: 'Loading...',
    // Alerts
    accessDenied: 'Access Denied',
    mustLogin: 'You must login first!',
    okay: 'Okay',
    userNotFound: 'User not found',
    checkEmail: 'Please check your email again!',
    incorrectPassword: 'Incorrect Password',
    tryAgain: 'Please try again.',
    loginSuccessful: 'Login Successful!',
    welcome: 'Welcome',
    errorOccurred: 'An error occurred'
    },
    id: {
    welcomeBack: 'Selamat Datang Kembali',
    pleaseLogin: 'Silakan login untuk melanjutkan',
    email: 'Email',
    emailPlaceholder: 'nama@example.com',
    password: 'Kata Sandi',
    passwordPlaceholder: '••••••••',
    loginButton: 'Masuk',
    loading: 'Memuat...',
    // Alerts
    accessDenied: 'Akses Ditolak',
    mustLogin: 'Anda harus login terlebih dahulu!',
    okay: 'Baik',
    userNotFound: 'Pengguna tidak ditemukan',
    checkEmail: 'Silakan periksa email Anda lagi!',
    incorrectPassword: 'Kata Sandi Salah',
    tryAgain: 'Silakan coba lagi.',
    loginSuccessful: 'Login Berhasil!',
    welcome: 'Selamat datang',
    errorOccurred: 'Terjadi kesalahan'
    }
}
}

export function LanguageProvider({ children }) {
const [language, setLanguage] = useState('en')

useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en'
    setLanguage(savedLang)
}, [])

const toggleLanguage = () => {
    const newLang = language === 'en' ? 'id' : 'en'
    setLanguage(newLang)
    localStorage.setItem('language', newLang)
}

return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t: translations }}>
    {children}
    </LanguageContext.Provider>
)
}

export function useLanguage() {
return useContext(LanguageContext)
}