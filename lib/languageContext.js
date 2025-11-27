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
    },

    // Layout
    layout: {  // ← UBAH DARI dashboard JADI layout
        en: {
        // Menu Items
        dashboard: 'Dashboard',
        products: 'Products',
        companies: 'Companies',
        customers: 'Customers',
        leads: 'Leads',
        deals: 'Deals',
        activities: 'Activities',
        tickets: 'Tickets',
        invoices: 'Invoices',
        services: 'Services',
        campaigns: 'Campaigns',
        teams: 'Teams',
        communications: 'Communications',
        manageAdmins: 'Manage Admins',
        logout: 'Logout',

        // Roles
        superAdmin: 'Super Admin',
        admin: 'Admin',

        // Alerts
        confirmLogout: 'Confirm Logout',
        logoutConfirm: 'Are you sure you want to log out?',
        yesLogout: 'Yes, Logout',
        cancel: 'Cancel',
        logoutSuccess: 'Logout successful!',
        seeYouAgain: 'See you again!',

        // Others
        loading: 'Loading...',
        accessDenied: 'Access Denied',
        mustLogin: 'You must login first!'
        },
        id: {
        // Menu Items
        dashboard: 'Beranda',
        products: 'Produk',
        companies: 'Perusahaan',
        customers: 'Pelanggan',
        leads: 'Prospek',
        deals: 'Transaksi',
        activities: 'Aktivitas',
        tickets: 'Tiket',
        invoices: 'Faktur',
        services: 'Layanan',
        campaigns: 'Kampanye',
        teams: 'Tim',
        communications: 'Komunikasi',
        manageAdmins: 'Kelola Admin',
        logout: 'Keluar',

        // Roles
        superAdmin: 'Super Admin',
        admin: 'Admin',

        // Alerts
        confirmLogout: 'Konfirmasi Keluar',
        logoutConfirm: 'Apakah Anda yakin ingin keluar?',
        yesLogout: 'Ya, Keluar',
        cancel: 'Batal',
        logoutSuccess: 'Berhasil keluar!',
        seeYouAgain: 'Sampai jumpa lagi!',

        // Others
        loading: 'Memuat...',
        accessDenied: 'Akses Ditolak',
        mustLogin: 'Anda harus login terlebih dahulu!'
        }
    },

    // Dashboard Home Page
    dashboard: {
        en: {
            // Banner
            welcomeBack: 'Welcome Back!',
            bannerSubtitle: 'Manage your CRM system efficiently from this dashboard',

            // Overview Section
            dashboardOverview: 'Dashboard Overview',
            overviewSubtitle: 'Select a menu from the sidebar to get started managing your CRM system.',

            // KPI Cards
            totalCustomers: 'Total Customers',
            dealsWon: 'Deals Won',
            openTickets: 'Open Tickets',
            activeServices: 'Active Services',

            // Loading States
            loadingDashboard: 'Loading dashboard data...',
            loadingCharts: 'Loading charts...'
        },
        id: {
            // Banner
            welcomeBack: 'Selamat Datang Kembali!',
            bannerSubtitle: 'Kelola sistem CRM Anda dengan efisien dimulai dari beranda ini',

            // Overview Section
            dashboardOverview: 'Ringkasan Beranda',
            overviewSubtitle: 'Pilih menu dari sidebar untuk mulai mengelola sistem CRM Anda.',

            // KPI Cards
            totalCustomers: 'Total Pelanggan',
            dealsWon: 'Transaksi Menang',
            openTickets: 'Tiket Terbuka',
            activeServices: 'Layanan Aktif',

            // Loading States
            loadingDashboard: 'Memuat data dasbor...',
            loadingCharts: 'Memuat grafik...'
        }
    },

    charts: {
        en: {
        activitiesBreakdown: 'Activities Breakdown',
        // Nanti bisa tambahin label chart lain di sini
        },
        id: {
        activitiesBreakdown: 'Rincian Aktivitas',
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