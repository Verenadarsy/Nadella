'use client'
import { useEffect, useState } from 'react'
import { showAlert } from '@/lib/sweetalert'
import SectionLoader from '../components/sectionloader'
import {
  Calendar, Clock, User, Edit2, Trash2,
  X, Save, Plus, Phone, Mail, Users,
  MessageSquare, FileText, ChevronDown, Search
} from 'lucide-react'
import FloatingChat from "../floatingchat"
import { useLanguage } from '@/lib/languageContext'

// 🔹 Fungsi buat dapetin waktu sekarang dalam format WIB
const getCurrentWIB = () => {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
  const wib = new Date(utcMs + 7 * 60 * 60 * 1000)
  const pad = (n) => n.toString().padStart(2, '0')
  const year = wib.getFullYear()
  const month = pad(wib.getMonth() + 1)
  const day = pad(wib.getDate())
  const hour = pad(wib.getHours())
  const minute = pad(wib.getMinutes())
  const second = pad(wib.getSeconds())
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

export default function ActivitiesPage() {
  const { language, t } = useLanguage()
  const texts = t.activities[language]
  const [activities, setActivities] = useState([])
  const [customers, setCustomers] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    notes: '',
    assigned_to: '',
  })
  const [editingId, setEditingId] = useState(null)
  const [typeOpen, setTypeOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userOpen, setUserOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredActivities, setFilteredActivities] = useState([])
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [userRole, setUserRole] = useState(null);

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

    fetchActivities()
    fetchCustomers()

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredActivities(activities)
    } else {
      const filtered = activities.filter((activity) =>
        activity.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getCustomerName(activity.assigned_to).toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredActivities(filtered)
    }
  }, [searchQuery, activities])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/activities')
      const data = await res.json()
      const activitiesData = Array.isArray(data) ? data : []
      setActivities(activitiesData)
      setFilteredActivities(activitiesData)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(Array.isArray(data) ? data : [])
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const activityData = {
      ...formData,
      date: getCurrentWIB(),
    }

    const url = '/api/activities'
    const method = editingId ? 'PUT' : 'POST'
    if (editingId) activityData.activity_id = editingId

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData),
    }).then(res => {
      if (res.ok) {
        showAlert({
          icon: 'success',
          title: texts.success,
          text: editingId ? texts.activityUpdated : texts.activityAdded,
          showConfirmButton: false,
          timer: 1500
        }, darkMode)
        setFormData({ type: '', notes: '', assigned_to: '' })
        setEditingId(null)
        fetchActivities()
      } else {
        showAlert({
          icon: 'error',
          title: texts.failed,
          text: texts.errorSaving
        }, darkMode)
      }
    })
  }

  const handleDelete = (id) => {
    if (userRole !== 'superadmin') {
      showAlert({
        icon: 'error',
        title: texts.accessDenied || 'Akses Ditolak',
        text: 'Hanya Superadmin yang dapat menghapus activity'
      }, darkMode);
      return;
    }

    showAlert({
      title: texts.deleteActivity,
      text: texts.cannotUndo,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: texts.yesDelete,
      cancelButtonText: texts.cancel,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode).then(confirm => {
      if (confirm.isConfirmed) {
        fetch('/api/activities', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        }).then(res => {
          if (res.ok) {
            showAlert({
              icon: 'success',
              title: texts.deleted,
              text: texts.activityDeleted,
              showConfirmButton: false,
              timer: 1500
            }, darkMode)
            fetchActivities()
          } else {
            showAlert({
              icon: 'error',
              title: texts.failed,
              text: texts.errorDeleting,
            }, darkMode)
          }
        })
      }
    })
  }

  const handleEdit = (activity) => {
    setEditingId(activity.activity_id)
    setFormData({
      type: activity.type,
      notes: activity.notes,
      assigned_to: activity.assigned_to,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getCustomerName = (id) => customers.find((c) => c.customer_id === id)?.name || '-'

  const getActivityIcon = (type) => {
    switch(type) {
      case 'call': return <Phone className="w-4 h-4" />
      case 'meeting': return <Users className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'follow-up': return <MessageSquare className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  const getActivityColor = (type) => {
    switch(type) {
      case 'call': return darkMode ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : 'bg-blue-100 text-blue-700 border-blue-200'
      case 'meeting': return darkMode ? 'bg-purple-600/20 text-purple-400 border-purple-600/30' : 'bg-purple-100 text-purple-700 border-purple-200'
      case 'email': return darkMode ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-green-100 text-green-700 border-green-200'
      case 'follow-up': return darkMode ? 'bg-orange-600/20 text-orange-400 border-orange-600/30' : 'bg-orange-100 text-orange-700 border-orange-200'
      default: return darkMode ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const activityTypes = [
    { value: 'call', label: texts.call, icon: <Phone className="w-4 h-4" /> },
    { value: 'meeting', label: texts.meeting, icon: <Users className="w-4 h-4" /> },
    { value: 'email', label: texts.email, icon: <Mail className="w-4 h-4" /> },
    { value: 'follow-up', label: texts.followUp, icon: <MessageSquare className="w-4 h-4" /> }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* FORM */}
      <div className={`rounded-xl p-6 mb-6 shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {editingId ? texts.editActivity : texts.addNewActivity}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Select */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.activityType}
              </label>

              <button
                type="button"
                onClick={() => setTypeOpen(!typeOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span className={`flex items-center gap-2 ${
                  formData.type ? "opacity-90" : "opacity-60"
                }`}>
                  {formData.type
                    ? activityTypes.find(t => t.value === formData.type)?.icon
                    : <Calendar className="w-4 h-4" />
                  }
                  {formData.type
                    ? activityTypes.find(t => t.value === formData.type)?.label
                    : "Select Activity Type"
                  }
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {typeOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  {activityTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, type: type.value })
                        setTypeOpen(false)
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                        darkMode ? "hover:bg-slate-600" : "hover:bg-slate-100"
                      }`}
                    >
                      {type.icon}
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned To */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.assignTo}
              </label>

              <button
                type="button"
                onClick={() => setUserOpen(!userOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span className={`flex items-center gap-2 ${
                  formData.assigned_to ? "opacity-90" : "opacity-60"
                }`}>
                  <User size={16} className="opacity-60" />
                  {formData.assigned_to
                    ? customers.find((c) => c.customer_id === formData.assigned_to)?.name
                    : texts.selectUser || "Select Customer"}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {userOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  {/* Search Input */}
                  <div className="p-2 border-b-2" style={{ borderColor: darkMode ? '#475569' : '#E2E8F0' }}>
                    <div className="relative">
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder={texts.searchUser || "Search customer..."}
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
                      .filter(c => c.name.toLowerCase().includes(userSearchQuery.toLowerCase()))
                      .map((c) => (
                        <button
                          key={c.customer_id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, assigned_to: c.customer_id })
                            setUserOpen(false)
                            setUserSearchQuery("")
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                            darkMode ? "hover:bg-slate-600" : "hover:bg-slate-100"
                          }`}
                        >
                          <User size={16} className="opacity-70" />
                          {c.name}
                        </button>
                      ))}
                    {customers.filter(c => c.name.toLowerCase().includes(userSearchQuery.toLowerCase())).length === 0 && (
                      <div className={`px-4 py-2 text-center text-sm ${
                        darkMode ? 'text-slate-400' : 'text-slate-400'
                      }`}>
                        {texts.noResults || 'Tidak ada hasil'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {texts.notes}
            </label>
            <div className="relative">
              <FileText className={`absolute left-3 top-3 w-5 h-5 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <textarea
                name="notes"
                placeholder={texts.notesPlaceholder}
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors resize-none ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                } outline-none`}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                editingId
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg hover:shadow-xl`}
            >
              {editingId ? (
                <>
                  <Save className="w-5 h-5" />
                  {texts.updateActivity}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {texts.addActivity}
                </>
              )}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setFormData({ type: '', notes: '', assigned_to: '' })
                }}
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
        </div>
      </div>

      {/* ACTIVITIES LIST */}
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
              {texts.activitiesList} ({filteredActivities.length})
            </h2>

            {/* Search Bar */}
            <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={texts.searchActivities}
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
          <SectionLoader darkMode={darkMode} text={texts.loadingActivities} />
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {texts.noActivitiesYet}
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
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.type}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.dateTime}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.assignedTo}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Notes
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.actions}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {activities.map((activity) => (
                  <tr key={activity.activity_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${
                        getActivityColor(activity.type)
                      }`}>
                        {getActivityIcon(activity.type)}
                        <span className="capitalize">{activity.type}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(activity.date).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Asia/Jakarta',
                        })}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {getCustomerName(activity.assigned_to)}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      <div className="max-w-xs truncate">
                        {activity.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(activity)}
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
                            onClick={() => handleDelete(activity.activity_id)}
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