'use client'
import { useEffect, useState } from 'react'
import { showAlert } from '@/lib/sweetalert'
import { useLanguage } from '@/lib/languageContext'
import { User, Mail, Phone, MapPin, Save, Calendar } from 'lucide-react'

export default function ClientProfile() {
const { language, t } = useLanguage()
const texts = t.client[language]
const [darkMode, setDarkMode] = useState(false)
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

    const res = await fetch('/api/customers')
    const customers = await res.json()

    const emailCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userEmail='))
        ?.split('=')[1]

    const decodedEmail = emailCookie ? decodeURIComponent(emailCookie) : ''
    const customer = customers.find(c => c.email === decodedEmail)

    if (customer) {
        setCustomerData(customer)
        setForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || ''
        })
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
        text: texts.profileUpdated,
        timer: 1500,
        showConfirmButton: false
        }, darkMode)
        fetchCustomerData()
    } else {
        showAlert({
        icon: 'error',
        title: texts.failed,
        text: texts.errorSaving
        }, darkMode)
    }
    } catch (err) {
    console.error('Error updating profile:', err)
    showAlert({
        icon: 'error',
        title: texts.failed,
        text: texts.errorSaving
    }, darkMode)
    }
}

if (loading) {
    return (
    <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
        <div className={`h-12 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
        <div className={`h-96 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}></div>
        </div>
    </div>
    )
}

return (
    <div className="p-6 max-w-4xl mx-auto">
    {/* Header */}
    <div className="mb-6">
        <h1 className={`text-3xl font-bold ${
        darkMode ? 'text-white' : 'text-slate-900'
        }`}>
        {texts.myProfile}
        </h1>
        <p className={`mt-2 ${
        darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
        {texts.profileInfo}
        </p>
    </div>

    {/* Profile Form */}
    <div className={`rounded-xl p-6 shadow-lg mb-6 ${
        darkMode ? 'bg-slate-800' : 'bg-white'
    }`}>
        <h2 className={`text-lg font-semibold mb-6 ${
        darkMode ? 'text-white' : 'text-slate-900'
        }`}>
        {texts.editProfile}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
            <label className={`block text-sm font-medium mb-2 ${
            darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
            {texts.fullName}
            </label>
            <div className="relative">
            <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
            }`} />
            <input
                type="text"
                name="name"
                placeholder={texts.namePlaceholder}
                value={form.name}
                onChange={handleChange}
                required
                className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                } outline-none`}
            />
            </div>
        </div>

        {/* Email */}
        <div>
            <label className={`block text-sm font-medium mb-2 ${
            darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
            {texts.email}
            </label>
            <div className="relative">
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
            }`} />
            <input
                type="email"
                name="email"
                placeholder={texts.emailPlaceholder}
                value={form.email}
                onChange={handleChange}
                required
                className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                } outline-none`}
            />
            </div>
        </div>

        {/* Phone */}
        <div>
            <label className={`block text-sm font-medium mb-2 ${
            darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
            {texts.phone}
            </label>
            <div className="relative">
            <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
            }`} />
            <input
                type="tel"
                name="phone"
                placeholder={texts.phonePlaceholder}
                value={form.phone}
                onChange={handleChange}
                required
                className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                } outline-none`}
            />
            </div>
        </div>

        {/* Address */}
        <div>
            <label className={`block text-sm font-medium mb-2 ${
            darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
            {texts.address}
            </label>
            <div className="relative">
            <MapPin className={`absolute left-3 top-3 w-5 h-5 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
            }`} />
            <textarea
                name="address"
                placeholder={texts.addressPlaceholder}
                value={form.address}
                onChange={handleChange}
                required
                rows="3"
                className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors resize-none ${
                darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                } outline-none`}
            />
            </div>
        </div>

        {/* Submit Button */}
        <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
            <Save className="w-5 h-5" />
            {texts.updateProfile}
        </button>
        </form>
    </div>

    {/* Account Details Card */}
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
            <Calendar className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <div>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {texts.accountCreated}
            </p>
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {customerData?.created_at
                ? new Date(customerData.created_at).toLocaleDateString()
                : '-'
                }
            </p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <User className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
            <div>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {texts.customerID}
            </p>
            <p className={`font-mono text-xs ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {customerData?.customer_id || '-'}
            </p>
            </div>
        </div>
        </div>
    </div>
    </div>
)
}