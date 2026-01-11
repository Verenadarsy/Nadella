'use client'
import { useEffect, useState } from 'react'
import { showAlert } from '@/lib/sweetalert';
import {
  Handshake, Edit2, Trash2, X, Save, Plus,
  Banknote, Calendar, User, Building2, TrendingUp, ChevronDown, Search,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react'
import FloatingChat from "../floatingchat"
import SectionLoader from '../components/sectionloader'
import { useLanguage } from '@/lib/languageContext'

export default function DealsPage() {
  const { language, t } = useLanguage()
  const texts = t.deals[language]
  const [deals, setDeals] = useState([])
  const [customers, setCustomers] = useState([])
  const [companies, setCompanies] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [formData, setFormData] = useState({
    deal_name: '',
    deal_stage: '',
    deal_value: '',
    expected_close_date: '',
    customer_id: '',
    company_id: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [stageOpen, setStageOpen] = useState(false)
  const [companyOpen, setCompanyOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredDeals, setFilteredDeals] = useState([])
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)
  const [companySearchOpen, setCompanySearchOpen] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")
  const [companySearchQuery, setCompanySearchQuery] = useState("")
  const [sortBy, setSortBy] = useState(null) // null, 'name', atau 'stage'
  const [sortDirection, setSortDirection] = useState('asc')
  const [userRole, setUserRole] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date())

  useEffect(() => {
    // Detect dark mode from parent layout
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    const roleCookie = document.cookie
      .split("; ")
      .find((r) => r.startsWith("userRole="))
      ?.split("=")[1];

    setUserRole(roleCookie);

    fetchDeals()
    fetchCustomers()
    fetchCompanies()

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCalendar && !e.target.closest('.relative')) {
        setShowCalendar(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)  // ✅ CUMA INI AJA!
    }
  }, [showCalendar])

      // Filter dan Sort deals
      useEffect(() => {
        let result = [...deals]

        // Filter berdasarkan search query
        if (searchQuery.trim() !== "") {
          result = result.filter((deal) =>
            deal.deal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            deal.deal_stage.toLowerCase().includes(searchQuery.toLowerCase()) ||
            getCustomerName(deal.customer_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
            getCompanyName(deal.company_id).toLowerCase().includes(searchQuery.toLowerCase())
          )
        }

        // Sort berdasarkan kolom yang dipilih
        if (sortBy === 'name') {
          result.sort((a, b) => {
            const compare = a.deal_name.localeCompare(b.deal_name)
            return sortDirection === 'asc' ? compare : -compare
          })
        } else if (sortBy === 'stage') {
          // Urutan stage: prospect -> negotiation -> won -> lost
          const stageOrder = { prospect: 1, negotiation: 2, won: 3, lost: 4 }
          result.sort((a, b) => {
            const compare = (stageOrder[a.deal_stage] || 999) - (stageOrder[b.deal_stage] || 999)
            return sortDirection === 'asc' ? compare : -compare
          })
        }

        setFilteredDeals(result)
      }, [searchQuery, deals, sortBy, sortDirection])

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/deals')
      const data = await res.json()
      const dealsData = Array.isArray(data) ? data : []
      setDeals(dealsData)
      setFilteredDeals(dealsData)
    } catch (err) {
      console.error('Error fetching deals:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(Array.isArray(data) ? data : [])
  }

  const fetchCompanies = async () => {
    const res = await fetch('/api/companies')
    const data = await res.json()
    setCompanies(Array.isArray(data) ? data : [])
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const method = isEditing ? 'PUT' : 'POST'
    const payload = isEditing ? { ...formData, deal_id: editingId } : formData

    const res = await fetch('/api/deals', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      showAlert({
        icon: 'success',
        title: texts.success,
        text: isEditing ? texts.dealUpdated : texts.dealAdded,
        showConfirmButton: false,
        timer: 1500
      }, darkMode)
      setFormData({
        deal_name: '',
        deal_stage: '',
        deal_value: '',
        expected_close_date: '',
        customer_id: '',
        company_id: '',
      })
      setIsEditing(false)
      setEditingId(null)
      fetchDeals()
    } else {
      showAlert({
        icon: 'error',
        title: texts.failed,
        text: texts.unableToSaveDeal
      }, darkMode)
    }
  }

  const handleEdit = (deal) => {
    setFormData({
      deal_name: deal.deal_name,
      deal_stage: deal.deal_stage,
      deal_value: deal.deal_value,
      expected_close_date: deal.expected_close_date,
      customer_id: deal.customer_id,
      company_id: deal.company_id,
    })
    setIsEditing(true)
    setEditingId(deal.deal_id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (userRole !== 'superadmin') {
        showAlert({
          icon: 'error',
          title: texts.accessDenied || 'Akses Ditolak',
          text: 'Hanya Superadmin yang dapat menghapus deal'
        }, darkMode);
        return;
      }

    const confirm = await showAlert({
      title: texts.deleteDeal,
      text: texts.cannotUndo,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: texts.yesDelete,
      cancelButtonText: texts.cancel,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode)

    if (confirm.isConfirmed) {
      const res = await fetch('/api/deals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        showAlert({
          icon: 'success',
          title: texts.deleted,
          text: texts.dealDeleted,
          showConfirmButton: false,
          timer: 1500
        }, darkMode)
        fetchDeals()
      } else {
        showAlert({
          icon: 'error',
          title: texts.failed,
          text: texts.unableToDelete
        }, darkMode)
      }
    }
  }

  const handleCancel = () => {
    setFormData({
      deal_name: '',
      deal_stage: '',
      deal_value: '',
      expected_close_date: '',
      customer_id: '',
      company_id: '',
    })
    setIsEditing(false)
    setEditingId(null)
  }

  // Temukan nama customer/company dari ID
  const getCustomerName = (id) => customers.find(c => c.customer_id === id)?.name || '-'
  const getCompanyName = (id) => companies.find(c => c.company_id === id)?.company_name || '-'

  const getStageColor = (stage) => {
    switch(stage) {
      case 'prospect':
        return darkMode ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : 'bg-blue-100 text-blue-700 border-blue-200'
      case 'negotiation':
        return darkMode ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'won':
        return darkMode ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-green-100 text-green-700 border-green-200'
      case 'lost':
        return darkMode ? 'bg-red-600/20 text-red-400 border-red-600/30' : 'bg-red-100 text-red-700 border-red-200'
      default:
        return darkMode ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle direction kalau kolom sama
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set kolom baru dengan asc
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 text-slate-400" />
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />
  }

  // Helper untuk calendar
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Empty cells untuk hari sebelum tanggal 1
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Tanggal aktual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const formatMonthYear = (date) => {
    return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  const isToday = (day) => {
    if (!day) return false
    const today = new Date()
    return (
      day === today.getDate() &&
      calendarDate.getMonth() === today.getMonth() &&
      calendarDate.getFullYear() === today.getFullYear()
    )
  }

  const isSelected = (day) => {
    if (!day || !formData.expected_close_date) return false
    const selected = new Date(formData.expected_close_date + 'T00:00:00')
    return (
      day === selected.getDate() &&
      calendarDate.getMonth() === selected.getMonth() &&
      calendarDate.getFullYear() === selected.getFullYear()
    )
  }

  const handleDateSelect = (day) => {
    if (!day) return
    const year = calendarDate.getFullYear()
    const month = String(calendarDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    setFormData({ ...formData, expected_close_date: `${year}-${month}-${dayStr}` })
    setShowCalendar(false)
  }

  const changeMonth = (offset) => {
    const newDate = new Date(calendarDate)
    newDate.setMonth(newDate.getMonth() + offset)
    setCalendarDate(newDate)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* FORM */}
      <div className={`rounded-xl p-6 mb-6 shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {isEditing ? (
            <>
              <Edit2 className="w-5 h-5" />
              {texts.editDeal}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {texts.addNewDeal}
            </>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deal Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {texts.dealName}
            </label>

            <div className="relative">
              <Handshake className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-slate-500" : "text-slate-500"}`} />

              <input
                type="text"
                name="deal_name"
                placeholder={texts.dealNamePlaceholder}
                value={formData.deal_name}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors outline-none ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                    : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                }`}
              />
            </div>
          </div>

            {/* Deal Stage */}
            <div className="relative">
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {texts.dealStage}
              </label>

              {/* Button */}
              <button
                type="button"
                onClick={() => setStageOpen(!stageOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span
                  className={`flex items-center gap-2 ${
                    formData.deal_stage ? "opacity-90" : "opacity-60"
                  }`}
                >
                  <TrendingUp size={16} className="opacity-60" />
                  {formData.deal_stage ? (
                    <span className="capitalize">{texts[formData.deal_stage]}</span>
                  ) : texts.selectStage}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {/* Dropdown */}
              {stageOpen && (
                <div
                  className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-200 text-slate-900"
                  }`}
                >
                  {["prospect", "negotiation", "won", "lost"].map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setFormData({ ...formData, deal_stage: item });
                        setStageOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                        darkMode ? "hover:bg-slate-600" : "hover:bg-slate-100"
                      }`}
                    >
                      <TrendingUp size={16} className="opacity-70" />
                      <span className="capitalize">{texts[item]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>


            {/* Deal Value */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {texts.dealValue} (Rp)
              </label>

              <div className="relative">
                <Banknote className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-slate-500" : "text-slate-500"}`} />

                <input
                  type="number"
                  name="deal_value"
                  placeholder={texts.dealValuePlaceholder}
                  value={formData.deal_value}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors outline-none ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                      : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                  }`}
                />
              </div>
            </div>

            {/* Expected Close Date */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-slate-300" : "text-slate-700"
              }`}>
                {texts.expectedCloseDate}
              </label>

              {/* Custom Date Input */}
              <button
                type="button"
                onClick={() => {
                  setShowCalendar(!showCalendar)
                  if (!formData.expected_close_date) {
                    setCalendarDate(new Date())
                  } else {
                    setCalendarDate(new Date(formData.expected_close_date + 'T00:00:00'))
                  }
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white hover:border-blue-500"
                    : "bg-white border-gray-200 text-slate-900 hover:border-blue-600"
                }`}
              >
                <Calendar className={`w-4 h-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                <span className={formData.expected_close_date ? "" : (darkMode ? "text-slate-500" : "text-slate-400")}>
                  {formData.expected_close_date
                    ? new Date(formData.expected_close_date + 'T00:00:00').toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })
                    : (language === 'id' ? 'Pilih tanggal' : 'Select date')
                  }
                </span>
              </button>

              {/* Custom Calendar Popup */}
              {showCalendar && (
                <div className={`absolute mt-2 z-50 rounded-xl shadow-2xl border-2 p-4 w-80 ${
                  darkMode
                    ? 'bg-slate-800 border-slate-600'
                    : 'bg-white border-gray-200'
                }`}>
                  {/* Header - Month/Year Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => changeMonth(-1)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? 'hover:bg-slate-700 text-slate-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <ChevronDown className="w-5 h-5 rotate-90" />
                    </button>

                    <h3 className={`font-semibold ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {formatMonthYear(calendarDate)}
                    </h3>

                    <button
                      type="button"
                      onClick={() => changeMonth(1)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? 'hover:bg-slate-700 text-slate-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <ChevronDown className="w-5 h-5 -rotate-90" />
                    </button>
                  </div>

                  {/* Days of Week - MULTI LANGUAGE */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {(language === 'id'
                      ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
                      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                    ).map((day) => (
                      <div
                        key={day}
                        className={`text-center text-xs font-semibold py-2 ${
                          darkMode ? 'text-slate-400' : 'text-gray-600'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(calendarDate).map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleDateSelect(day)}
                        disabled={!day}
                        className={`
                          aspect-square rounded-lg text-sm font-medium transition-all
                          ${!day ? 'invisible' : ''}
                          ${isToday(day) && !isSelected(day)
                            ? (darkMode
                              ? 'bg-blue-600/20 text-blue-400 border-2 border-blue-600/50'
                              : 'bg-blue-100 text-blue-700 border-2 border-blue-300')
                            : ''
                          }
                          ${isSelected(day)
                            ? (darkMode
                              ? 'bg-blue-600 text-white shadow-lg scale-105'
                              : 'bg-blue-600 text-white shadow-lg scale-105')
                            : ''
                          }
                          ${!isToday(day) && !isSelected(day)
                            ? (darkMode
                              ? 'text-slate-300 hover:bg-slate-700 hover:scale-105'
                              : 'text-gray-700 hover:bg-gray-100 hover:scale-105')
                            : ''
                          }
                        `}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  {/* Footer Buttons - MULTI LANGUAGE */}
                  <div className={`flex gap-2 mt-4 pt-4 border-t ${
                    darkMode ? 'border-slate-700' : 'border-gray-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date()
                        const year = today.getFullYear()
                        const month = String(today.getMonth() + 1).padStart(2, '0')
                        const day = String(today.getDate()).padStart(2, '0')
                        setFormData({ ...formData, expected_close_date: `${year}-${month}-${day}` })
                        setShowCalendar(false)
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        darkMode
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {language === 'id' ? 'Hari Ini' : 'Today'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, expected_close_date: '' })
                        setShowCalendar(false)
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        darkMode
                          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {language === 'id' ? 'Hapus' : 'Clear'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Select */}
            <div className="relative">
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {texts.customer}
              </label>

              {/* Button */}
              <button
                type="button"
                onClick={() => setCustomerOpen(!customerOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span
                  className={`flex items-center gap-2 ${
                    formData.customer_id ? "opacity-90" : "opacity-60"
                  }`}
                >
                  <User size={16} className="opacity-60" />
                  {formData.customer_id
                    ? customers.find((c) => c.customer_id === formData.customer_id)?.name
                    : texts.selectCustomer}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {/* Dropdown */}
              {customerOpen && (
                <div
                  className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-200 text-slate-900"
                  }`}
                >
                  {/* Search Input */}
                  <div className="p-2 border-b-2" style={{ borderColor: darkMode ? '#475569' : '#E2E8F0' }}>
                    <div className="relative">
                      <input
                        type="text"
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        placeholder={texts.searchCustomer}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 transition-colors outline-none ${
                          darkMode
                            ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400 focus:border-blue-500'
                            : 'bg-gray-50 border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Search
                        className={`absolute left-3 top-2.5 w-5 h-5 ${
                          darkMode ? 'text-slate-400' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
                    {customers
                      .filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()))
                      .map((c) => (
                        <button
                          key={c.customer_id}
                          onClick={() => {
                            setFormData({ ...formData, customer_id: c.customer_id });
                            setCustomerOpen(false);
                            setCustomerSearchQuery("");
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                            darkMode ? "hover:bg-slate-600" : "hover:bg-slate-100"
                          }`}
                        >
                          <User size={16} className="opacity-70" />
                          {c.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>


            {/* Company */}
            <div className="relative">
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {texts.company}
              </label>

              {/* Button */}
              <button
                type="button"
                onClick={() => setCompanyOpen(!companyOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span
                  className={`flex items-center gap-2 ${
                    formData.company_id ? "opacity-90" : "opacity-60"
                  }`}
                >
                  <Building2 size={16} className="opacity-60" />
                  {formData.company_id
                    ? companies.find((c) => c.company_id === formData.company_id)
                        ?.company_name
                    : texts.selectCompany}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {/* Dropdown */}
              {companyOpen && (
                <div
                  className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-200 text-slate-900"
                  }`}
                >
                  {/* Search Input */}
                  <div className="p-2 border-b-2" style={{ borderColor: darkMode ? '#475569' : '#E2E8F0' }}>
                    <div className="relative">
                      <input
                        type="text"
                        value={companySearchQuery}
                        onChange={(e) => setCompanySearchQuery(e.target.value)}
                        placeholder={texts.searchCompany}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 transition-colors outline-none ${
                          darkMode
                            ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400 focus:border-blue-500'
                            : 'bg-gray-50 border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Search
                        className={`absolute left-3 top-2.5 w-5 h-5 ${
                          darkMode ? 'text-slate-400' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
                    {companies
                      .filter(c => c.company_name.toLowerCase().includes(companySearchQuery.toLowerCase()))
                      .map((c) => (
                        <button
                          key={c.company_id}
                          onClick={() => {
                            setFormData({ ...formData, company_id: c.company_id });
                            setCompanyOpen(false);
                            setCompanySearchQuery("");
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                            darkMode ? "hover:bg-slate-600" : "hover:bg-slate-100"
                          }`}
                        >
                          <Building2 size={16} className="opacity-70" />
                          {c.company_name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                isEditing
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg hover:shadow-xl`}
            >
              {isEditing ? (
                <>
                  <Save className="w-5 h-5" />
                  {texts.updateDeal}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {texts.addDeal}
                </>
              )}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <X className="w-5 h-5" />
                {texts.cancel}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* DEALS LIST */}
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {texts.dealsList} ({filteredDeals.length})
            </h2>

            {/* Search Bar */}
            <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={texts.searchDeals}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 transition-colors outline-none ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                }`}
              />
              <Search className={`absolute left-3 top-2.5 w-5 h-5 ${
                darkMode ? 'text-slate-400' : 'text-slate-400'
              }`} />
            </div>
          </div>
        </div>

        {loading ? (
          <SectionLoader darkMode={darkMode} text={texts.loadingDeals} />
        ) : filteredDeals.length === 0 ? (
          <div className="p-12 text-center">
            <Handshake className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {texts.noDealsYet}
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {texts.createFirst}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr>
                  {/* DEAL NAME - CLICKABLE SORT */}
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 hover:text-blue-500 transition-colors uppercase"
                    >
                      {texts.dealNameHeader}
                      {getSortIcon('name')}
                    </button>
                  </th>

                  {/* STAGE - CLICKABLE SORT */}
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    <button
                      onClick={() => handleSort('stage')}
                      className="flex items-center gap-2 hover:text-blue-500 transition-colors uppercase"
                    >
                      {texts.stage}
                      {getSortIcon('stage')}
                    </button>
                  </th>

                  {/* VALUE - NO SORT */}
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.value}
                  </th>

                  {/* CUSTOMER - NO SORT */}
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.customerHeader}
                  </th>

                  {/* COMPANY - NO SORT */}
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.companyHeader}
                  </th>

                  {/* CLOSE DATE - NO SORT, WHITESPACE NOWRAP */}
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.closeDate}
                  </th>

                  {/* ACTIONS - NO SORT */}
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.actions}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {filteredDeals.map((deal) => (
                  <tr key={deal.deal_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 ${
                      darkMode ? 'text-slate-300' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Handshake className="w-4 h-4" />
                        <span className="font-medium">{deal.deal_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${
                        getStageColor(deal.deal_stage)
                      }`}>
                        <TrendingUp className="w-4 h-4" />
                        <span className="capitalize">{texts[deal.deal_stage]}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {deal.deal_value ? `Rp ${Number(deal.deal_value).toLocaleString('id-ID')}` : '-'}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        {getCustomerName(deal.customer_id)}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        {getCompanyName(deal.company_id)}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(deal)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          }`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {userRole === 'superadmin' && (
                          <button
                            onClick={() => handleDelete(deal.deal_id)}
                            className={`p-2 rounded-lg transition-colors ${
                              darkMode
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <FloatingChat />
    </div>
  )
}