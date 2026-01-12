'use client'
import { useEffect, useState } from 'react'
import { showAlert } from '@/lib/sweetalert'
import SectionLoader from '../components/sectionloader'
import {
  Megaphone, Edit2, Trash2, X, Save, Plus,
  Calendar, TrendingUp, Mail, Smartphone, Radio,
  Banknote, ChevronDown, Activity, Search,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react'
import FloatingChat from "../floatingchat"
import { useLanguage } from '@/lib/languageContext'

export default function CampaignsPage() {
  const { language, t } = useLanguage()
  const texts = t.campaigns[language]
  const [campaigns, setCampaigns] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    campaign_id: '',
    campaign_name: '',
    channel: '',
    start_date: '',
    end_date: '',
    budget: ''
  })
  const [channelOpen, setChannelOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCampaigns, setFilteredCampaigns] = useState([])
 const [sortBy, setSortBy] = useState(null) // null, 'name', 'channel', atau 'budget'
  const [sortDirection, setSortDirection] = useState('asc')
  const [userRole, setUserRole] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState(true) // true = pilih start, false = pilih end
  const [tempStartDate, setTempStartDate] = useState(null) // temporary storage


  useEffect(() => {
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

    fetchCampaigns()

    return () => observer.disconnect()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/campaigns')
      const data = await res.json()
      const campaignsData = Array.isArray(data) ? data : []
      setCampaigns(campaignsData)
      setFilteredCampaigns(campaignsData)
    } catch (error) {
      console.error('Fetch campaigns error:', error)
    } finally {
      setLoading(false)
    }
  }


  // Filter dan Sort campaigns
  useEffect(() => {
    let result = [...campaigns]

    // Filter berdasarkan search query
    if (searchQuery.trim() !== "") {
      result = result.filter((camp) =>
        camp.campaign_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camp.channel.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort berdasarkan kolom yang dipilih
    if (sortBy === 'name') {
      result.sort((a, b) => {
        const compare = a.campaign_name.localeCompare(b.campaign_name)
        return sortDirection === 'asc' ? compare : -compare
      })
    } else if (sortBy === 'channel') {
      // Urutan channel: email -> ads -> sms
      const channelOrder = { email: 1, ads: 2, sms: 3 }
      result.sort((a, b) => {
        const compare = (channelOrder[a.channel] || 999) - (channelOrder[b.channel] || 999)
        return sortDirection === 'asc' ? compare : -compare
      })
    } else if (sortBy === 'budget') {
      result.sort((a, b) => {
        const compare = Number(a.budget) - Number(b.budget)
        return sortDirection === 'asc' ? compare : -compare
      })
    }

    setFilteredCampaigns(result)
  }, [searchQuery, campaigns, sortBy, sortDirection])

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.campaign_name || !formData.channel || !formData.start_date || !formData.end_date || !formData.budget) {
      showAlert({
        icon: 'warning',
        title: texts.warning,
        text: texts.allFieldsRequired
      }, darkMode)
      return
    }

    const payload = {
      campaign_name: formData.campaign_name,
      channel: formData.channel,
      start_date: formData.start_date,
      end_date: formData.end_date,
      budget: parseFloat(formData.budget),
    }

    const method = isEditing ? 'PUT' : 'POST'
    if (isEditing) payload.campaign_id = formData.campaign_id

    try {
      const res = await fetch('/api/campaigns', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        showAlert({
          icon: 'success',
          title: texts.success,
          text: `${isEditing ? texts.campaignEdited : texts.campaignAdded}!`,
          showConfirmButton: false,
          timer: 1500
        }, darkMode)
        setFormData({ campaign_id: '', campaign_name: '', channel: '', start_date: '', end_date: '', budget: '' })
        setIsEditing(false)
        fetchCampaigns()
      } else {
        const err = await res.json()
        showAlert({
          icon: 'error',
          title: texts.failed,
          text: err?.error ?? texts.unableToSave
        }, darkMode)
      }
    } catch (error) {
      showAlert({
        icon: 'error',
        title: texts.error,
        text: texts.connectionError
      }, darkMode)
      console.error(error)
    }
  }

  const handleDelete = async (id) => {
      if (userRole !== 'superadmin') {
        showAlert({
          icon: 'error',
          title: texts.accessDenied || 'Akses Ditolak',
          text: 'Hanya Superadmin yang dapat menghapus campaign'
        }, darkMode);
        return;
      }
    const confirm = await showAlert({
      title: texts.deleteCampaign,
      text: texts.cannotUndo,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: texts.yesDelete,
      cancelButtonText: texts.cancel,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode)

    if (confirm.isConfirmed) {
      const res = await fetch('/api/campaigns', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        showAlert({
          icon: 'success',
          title: texts.deleted,
          text: texts.campaignDeleted,
          showConfirmButton: false,
          timer: 1500
        }, darkMode)
        fetchCampaigns()
      } else {
        showAlert({
          icon: 'error',
          title: texts.failed,
          text: texts.unableToDelete
        }, darkMode)
      }
    }
  }

  const handleEdit = (campaign) => {
    setFormData(campaign)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getChannelIcon = (channel) => {
    switch(channel) {
      case 'email': return <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      case 'ads': return <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      case 'sms': return <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      default: return <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
    }
  }

  const getChannelColor = (channel) => {
    switch(channel) {
      case 'email':
        return darkMode ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : 'bg-blue-100 text-blue-700 border-blue-200'
      case 'ads':
        return darkMode ? 'bg-purple-600/20 text-purple-400 border-purple-600/30' : 'bg-purple-100 text-purple-700 border-purple-200'
      case 'sms':
        return darkMode ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-green-100 text-green-700 border-green-200'
      default:
        return darkMode ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const channelOptions = [
    { value: 'email', label: texts.email, icon: <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
    { value: 'ads', label: texts.ads, icon: <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
    { value: 'sms', label: texts.sms, icon: <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> }
  ]

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
      ? <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      : <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

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

  const changeMonth = (offset) => {
    const newDate = new Date(calendarDate)
    newDate.setMonth(newDate.getMonth() + offset)
    setCalendarDate(newDate)
  }

  const handleStartDateSelect = (day) => {
    if (!day) return
    const year = startCalendarDate.getFullYear()
    const month = String(startCalendarDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    setFormData({ ...formData, start_date: `${year}-${month}-${dayStr}` })
    setShowStartCalendar(false)
  }

  const handleEndDateSelect = (day) => {
    if (!day) return
    const year = endCalendarDate.getFullYear()
    const month = String(endCalendarDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    setFormData({ ...formData, end_date: `${year}-${month}-${dayStr}` })
    setShowEndCalendar(false)
  }

  const changeStartMonth = (offset) => {
    const newDate = new Date(startCalendarDate)
    newDate.setMonth(newDate.getMonth() + offset)
    setStartCalendarDate(newDate)
  }

  const changeEndMonth = (offset) => {
    const newDate = new Date(endCalendarDate)
    newDate.setMonth(newDate.getMonth() + offset)
    setEndCalendarDate(newDate)
  }

  const isStartDateSelected = (day) => {
    if (!day || !formData.start_date) return false
    const selected = new Date(formData.start_date + 'T00:00:00')
    return (
      day === selected.getDate() &&
      calendarDate.getMonth() === selected.getMonth() &&
      calendarDate.getFullYear() === selected.getFullYear()
    )
  }

  const isEndDateSelected = (day) => {
    if (!day || !formData.end_date) return false
    const selected = new Date(formData.end_date + 'T00:00:00')
    return (
      day === selected.getDate() &&
      calendarDate.getMonth() === selected.getMonth() &&
      calendarDate.getFullYear() === selected.getFullYear()
    )
  }

  const isInRange = (day) => {
    if (!day || !formData.start_date || !formData.end_date) return false
    const currentDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)
    const start = new Date(formData.start_date + 'T00:00:00')
    const end = new Date(formData.end_date + 'T00:00:00')
    return currentDate > start && currentDate < end
  }

  const handleDateSelect = (day) => {
    if (!day) return

    const year = calendarDate.getFullYear()
    const month = String(calendarDate.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const selectedDate = `${year}-${month}-${dayStr}`

    if (selectingStart) {
      // Pilih start date
      setFormData({ ...formData, start_date: selectedDate, end_date: '' })
      setTempStartDate(selectedDate)
      setSelectingStart(false) // Next pilih end date
    } else {
      // Pilih end date
      const startDate = new Date(tempStartDate + 'T00:00:00')
      const endDate = new Date(selectedDate + 'T00:00:00')

      if (endDate < startDate) {
        // Kalau end date lebih kecil, swap
        setFormData({ ...formData, start_date: selectedDate, end_date: tempStartDate })
      } else {
        setFormData({ ...formData, end_date: selectedDate })
      }

      setShowCalendar(false)
      setSelectingStart(true) // Reset untuk next time
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* FORM */}
      <div className={`rounded-2xl p-4 sm:p-6 shadow-xl transition-all duration-300 ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {isEditing ? (
            <>
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
              {texts.editCampaign}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              {texts.addNewCampaign}
            </>
          )}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Campaign Name */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.campaignName}
              </label>
              <div className="relative">
                <Megaphone className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${
                  darkMode ? "text-slate-500" : "text-slate-500"
                }`} />
                <input
                  type="text"
                  name="campaign_name"
                  placeholder={texts.campaignNamePlaceholder}
                  value={formData.campaign_name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-colors outline-none ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                      : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                  }`}
                />
              </div>
            </div>

            {/* Channel Dropdown */}
            <div className="relative">
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.channel}
              </label>

              <button
                type="button"
                onClick={() => setChannelOpen(!channelOpen)}
                className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span className={`flex items-center gap-2 ${
                  formData.channel ? "opacity-90" : "opacity-60"
                }`}>
                  {formData.channel ? (
                    <>
                      {channelOptions.find(c => c.value === formData.channel)?.icon}
                      {channelOptions.find(c => c.value === formData.channel)?.label}
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                      {texts.selectChannel}
                    </>
                  )}
                </span>
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 opacity-60" />
              </button>

              {channelOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  {channelOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, channel: option.value })
                        setChannelOpen(false)
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                        darkMode ? "hover:bg-slate-600" : "hover:bg-slate-100"
                      }`}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Picker */}
            <div className="relative">
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                darkMode ? "text-slate-300" : "text-slate-700"
              }`}>
                {texts.campaignPeriod || 'Campaign Period'}
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowCalendar(!showCalendar)
                  setSelectingStart(true)
                  if (!formData.start_date) {
                    setCalendarDate(new Date())
                  } else {
                    setCalendarDate(new Date(formData.start_date + 'T00:00:00'))
                  }
                }}
                className={`w-full flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white hover:border-blue-500"
                    : "bg-white border-gray-200 text-slate-900 hover:border-blue-600"
                }`}
              >
                <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                <span className={(!formData.start_date && !formData.end_date) ? (darkMode ? "text-slate-500" : "text-slate-400") : ""}>
                  {formData.start_date && formData.end_date
                    ? `${new Date(formData.start_date + 'T00:00:00').toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })} - ${new Date(formData.end_date + 'T00:00:00').toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}`
                    : formData.start_date
                    ? `${new Date(formData.start_date + 'T00:00:00').toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })} - ${language === 'id' ? 'Pilih tanggal akhir' : 'Select end date'}`
                    : (language === 'id' ? 'Pilih periode campaign' : 'Select campaign period')
                  }
                </span>
              </button>

              {/* Calendar Popup - COPY EXACT DARI DEALS.JSX */}
              {showCalendar && (
                <div className={`absolute mt-2 z-50 rounded-xl shadow-2xl border-2 p-3 sm:p-4 w-[calc(100vw-2rem)] max-w-[320px] ${
                  darkMode
                    ? 'bg-slate-800 border-slate-600'
                    : 'bg-white border-gray-200'
                }`}>
                  {/* Info text untuk user */}
                  <div className={`text-xs mb-3 text-center ${
                    darkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    {selectingStart
                      ? (language === 'id' ? 'Pilih tanggal mulai' : 'Select start date')
                      : (language === 'id' ? 'Pilih tanggal selesai' : 'Select end date')
                    }
                  </div>

                  {/* Header - Month/Year Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => changeMonth(-1)}
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
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
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                        darkMode
                          ? 'hover:bg-slate-700 text-slate-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <ChevronDown className="w-5 h-5 -rotate-90" />
                    </button>
                  </div>

                  {/* Days of Week */}
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
                    {getDaysInMonth(calendarDate).map((day, index) => {
                      const isStart = isStartDateSelected(day)
                      const isEnd = isEndDateSelected(day)
                      const inRange = isInRange(day)

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleDateSelect(day)}
                          disabled={!day}
                          className={`
                            aspect-square rounded-lg text-sm font-medium transition-all
                            ${!day ? 'invisible' : ''}
                            ${isStart || isEnd
                              ? (darkMode
                                ? 'bg-blue-600 text-white shadow-lg scale-105 z-10'
                                : 'bg-blue-600 text-white shadow-lg scale-105 z-10')
                              : ''
                            }
                            ${inRange && !isStart && !isEnd
                              ? (darkMode
                                ? 'bg-blue-600/30 text-blue-300'
                                : 'bg-blue-100 text-blue-700')
                              : ''
                            }
                            ${isToday(day) && !isStart && !isEnd && !inRange
                              ? (darkMode
                                ? 'bg-blue-600/20 text-blue-400 border-2 border-blue-600/50'
                                : 'bg-blue-100 text-blue-700 border-2 border-blue-300')
                              : ''
                            }
                            ${!isToday(day) && !isStart && !isEnd && !inRange
                              ? (darkMode
                                ? 'text-slate-300 hover:bg-slate-700 hover:scale-105'
                                : 'text-gray-700 hover:bg-gray-100 hover:scale-105')
                              : ''
                            }
                          `}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>

                  {/* Footer Buttons */}
                  <div className={`flex gap-2 mt-4 pt-4 border-t ${
                    darkMode ? 'border-slate-700' : 'border-gray-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, start_date: '', end_date: '' })
                        setTempStartDate(null)
                        setSelectingStart(true)
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

                    <button
                      type="button"
                      onClick={() => setShowCalendar(false)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        darkMode
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {language === 'id' ? 'Tutup' : 'Close'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Budget */}
            <div className="relative">
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.budget}
              </label>
              <div className="relative">
                <Banknote className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${
                  darkMode ? "text-slate-500" : "text-slate-500"
                }`} />
                <input
                  type="number"
                  name="budget"
                  placeholder={texts.budgetPlaceholder}
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  className={`w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-colors outline-none ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                      : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                isEditing
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg hover:shadow-xl`}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  {texts.updateCampaign}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  {texts.addCampaign}
                </>
              )}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setFormData({ campaign_id: '', campaign_name: '', channel: '', start_date: '', end_date: '', budget: '' })
                }}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                {texts.cancel}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CAMPAIGNS LIST */}
      <div className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <h2 className={`text-base sm:text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {texts.campaignsList} ({filteredCampaigns.length})
            </h2>

            {/* Search Bar */}
            <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={texts.searchCampaigns}
                className={`w-full pl-9 pr-3 sm:pl-10 sm:pr-4 py-2 text-sm sm:text-base rounded-lg border-2 transition-colors outline-none ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <Search className={`absolute left-2.5 sm:left-3 top-2 sm:top-2.5 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
          </div>
        </div>

        {loading ? (
          <SectionLoader darkMode={darkMode} text={texts.loadingCampaigns} />
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-base sm:text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {searchQuery ? (texts.noResults || 'Tidak ada hasil yang ditemukan') : texts.noCampaignsYet}
            </p>
            <p className={`text-xs sm:text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {searchQuery ? (texts.tryDifferentKeyword || 'Coba kata kunci lain') : texts.createFirst}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[900px]">
              <thead className={darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr>
                  {/* CAMPAIGN NAME - CLICKABLE SORT */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold tracking-wider uppercase ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 hover:text-blue-500 transition-colors uppercase"
                    >
                      {texts.campaignNameHeader}
                      {getSortIcon('name')}
                    </button>
                  </th>

                  {/* CHANNEL - CLICKABLE SORT */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold tracking-wider uppercase ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    <button
                      onClick={() => handleSort('channel')}
                      className="flex items-center gap-2 hover:text-blue-500 transition-colors uppercase"
                    >
                      {texts.channelHeader}
                      {getSortIcon('channel')}
                    </button>
                  </th>

                  {/* PERIOD - NO SORT, UPPERCASE */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold tracking-wider uppercase ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.period}
                  </th>

                  {/* BUDGET - CLICKABLE SORT */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold tracking-wider uppercase ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    <button
                      onClick={() => handleSort('budget')}
                      className="flex items-center gap-2 hover:text-blue-500 transition-colors uppercase"
                    >
                      {texts.budgetHeader}
                      {getSortIcon('budget')}
                    </button>
                  </th>

                  {/* ACTIONS - NO SORT, UPPERCASE */}
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.actions}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.campaign_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-2 sm:px-6 py-2.5 sm:py-4 text-xs sm:text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="font-medium">{campaign.campaign_name}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${
                        getChannelColor(campaign.channel)
                      }`}>
                        {getChannelIcon(campaign.channel)}
                        <span className="capitalize">{campaign.channel}</span>
                      </div>
                    </td>
                    <td className={`px-2 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>
                          {new Date(campaign.start_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                          {' - '}
                          {new Date(campaign.end_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className={`px-2 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap text-xs sm:text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          Rp {Number(campaign.budget).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(campaign)}
                          className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                            darkMode
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          }`}
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        {userRole === 'superadmin' && (
                        <button
                          onClick={() => handleDelete(campaign.campaign_id)}
                          className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                            darkMode
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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