'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { showAlert } from '@/lib/sweetalert'
import { useLanguage } from '@/lib/languageContext'
import { User, Mail, Phone, MapPin, X, AlertCircle } from 'lucide-react'

export default function ClientDashboard() {
const router = useRouter()
const { language, t } = useLanguage()
const texts = t.client[language]
const [darkMode, setDarkMode] = useState(false)
const [showModal, setShowModal] = useState(false)
const [customerData, setCustomerData] = useState(null)
const [loading, setLoading] = useState(true)
const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
})

useEffect(() => {
    const checkDarkMode = () => {
    setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchCustomerData()

    return () => observer.disconnect()
}, [])

const fetchCustomerData = async () => {
    try {
    setLoading(true)

    // Get user_id from token (you'll need to decode JWT or get from API)
    const res = await fetch('/api/customers')
    const customers = await res.json()

    // Get email from cookie to find customer
    const emailCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userEmail='))
        ?.split('=')[1]

    const decodedEmail = emailCookie ? decodeURIComponent(emailCookie) : ''

    // Find customer by email
    const customer = customers.find(c => c.email === decodedEmail)

    if (customer) {
        setCustomerData(customer)
        setForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || ''
        })

        // Check if profile is incomplete
        const isIncomplete = !customer.name || !customer.phone || !customer.address
        if (isIncomplete) {
        setShowModal(true)
        }
    }
    } catch (err) {
    console.error('Error fetching customer data:', err)
    } finally {
    setLoading(false)
    }
}

const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
}

const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name || !form.email || !form.phone || !form.address) {
    showAlert({
        icon: 'warning',
        title: texts.failed,
        text: texts.allFieldsRequired
    }, darkMode)
    return
    }

    try {
    const res = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        customer_id: customerData.customer_id,
        ...form
        })
    })

    if (res.ok) {
        showAlert({
        icon: 'success',
        title: texts.success,
        text: texts.profileSaved,
        timer: 1500,
        showConfirmButton: false
        }, darkMode)
        setShowModal(false)
        fetchCustomerData()
    } else {
        showAlert({
        icon: 'error',
        title: texts.failed,
        text: texts.errorSaving
        }, darkMode)
    }
    } catch (err) {
    console.error('Error saving profile:', err)
    showAlert({
        icon: 'error',
        title: texts.failed,
        text: texts.errorSaving
    }, darkMode)
    }
}

if (loading) {
    return (
    <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
        <div className={`h-32 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
        <div className={`h-64 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
        </div>
    </div>
    )
}

return (
    <>
    <div className="p-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className={`rounded-xl p-6 mb-6 shadow-lg ${
        darkMode
            ? 'bg-gradient-to-r from-blue-600 to-blue-800'
            : 'bg-gradient-to-r from-blue-900 to-blue-700'
        }`}>
        <h1 className="text-2xl font-bold text-white mb-2">
            {texts.welcomeBack}!
        </h1>
        <p className="text-blue-100">
            {texts.dashboardSubtitle}
        </p>
        </div>

        {/* Profile Incomplete Warning */}
        {(!customerData?.name || !customerData?.phone || !customerData?.address) && (
        <div className={`rounded-xl p-6 mb-6 shadow-lg border-2 ${
            darkMode
            ? 'bg-yellow-900/20 border-yellow-600'
            : 'bg-yellow-50 border-yellow-400'
        }`}>
            <div className="flex items-start gap-4">
            <AlertCircle className={`w-6 h-6 shrink-0 ${
                darkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${
                darkMode ? 'text-yellow-400' : 'text-yellow-800'
                }`}>
                {texts.completeProfile}
                </h3>
                <p className={`mb-4 ${
                darkMode ? 'text-yellow-300' : 'text-yellow-700'
                }`}>
                {texts.profileIncomplete}
                </p>
                <button
                onClick={() => setShowModal(true)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    darkMode
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }`}
                >
                {texts.completeNow}
                </button>
            </div>
            </div>
        </div>
        )}

        {/* Account Info Card */}
        <div className={`rounded-xl p-6 shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
        <h2 className={`text-lg font-semibold mb-4 ${
            darkMode ? 'text-white' : 'text-slate-900'
        }`}>
            {texts.accountInfo}
        </h2>
        <div className="space-y-3">
            <div className="flex items-center gap-3">
            <User className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <div>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {texts.fullName}
                </p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {customerData?.name || '-'}
                </p>
            </div>
            </div>
            <div className="flex items-center gap-3">
            <Mail className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <div>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {texts.email}
                </p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {customerData?.email || '-'}
                </p>
            </div>
            </div>
            <div className="flex items-center gap-3">
            <Phone className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <div>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {texts.phone}
                </p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {customerData?.phone || '-'}
                </p>
            </div>
            </div>
            <div className="flex items-center gap-3">
            <MapPin className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <div>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {texts.address}
                </p>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {customerData?.address || '-'}
                </p>
            </div>
            </div>
        </div>
        </div>
    </div>

    {/* Modal Pop-up */}
    {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-md rounded-xl shadow-2xl ${
            darkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
            darkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
            <h2 className={`text-xl font-bold ${
                darkMode ? 'text-white' : 'text-slate-900'
            }`}>
                {texts.fillProfile}
            </h2>
            <button
                onClick={() => setShowModal(false)}
                className={`p-1 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
            >
                <X className="w-5 h-5" />
            </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className={`text-sm mb-4 ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
                {texts.profileDescription}
            </p>

            {/* Name */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                {texts.fullName}
                </label>
                <input
                type="text"
                name="name"
                placeholder={texts.namePlaceholder}
                value={form.name}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                    darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                } outline-none`}
                />
            </div>

            {/* Email */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                {texts.email}
                </label>
                <input
                type="email"
                name="email"
                placeholder={texts.emailPlaceholder}
                value={form.email}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                    darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                } outline-none`}
                />
            </div>

            {/* Phone */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                {texts.phone}
                </label>
                <input
                type="tel"
                name="phone"
                placeholder={texts.phonePlaceholder}
                value={form.phone}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                    darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                } outline-none`}
                />
            </div>

            {/* Address */}
            <div>
                <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                {texts.address}
                </label>
                <textarea
                name="address"
                placeholder={texts.addressPlaceholder}
                value={form.address}
                onChange={handleChange}
                required
                rows="3"
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors resize-none ${
                    darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                } outline-none`}
                />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
                <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg"
                >
                {texts.saveProfile}
                </button>
                <button
                type="button"
                onClick={() => setShowModal(false)}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                    darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                >
                {texts.cancel}
                </button>
            </div>
            </form>
        </div>
        </div>
    )}
    </>
)
}