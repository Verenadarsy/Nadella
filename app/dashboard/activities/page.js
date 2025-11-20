'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import FloatingChat from "../floatingchat"
import {
  Calendar, Clock, User, Edit2, Trash2,
  X, Save, Plus, Phone, Mail, Users as UsersIcon,
  MessageSquare
} from 'lucide-react'

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
  const [activities, setActivities] = useState([])
  const [users, setUsers] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [formData, setFormData] = useState({
    type: '',
    notes: '',
    assigned_to: '',
  })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    // Detect dark mode from parent layout
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchActivities()
    fetchUsers()

    return () => observer.disconnect()
  }, [])

  const fetchActivities = async () => {
    const res = await fetch('/api/activities')
    const data = await res.json()
    setActivities(Array.isArray(data) ? data : [])
  }

  const fetchUsers = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const activityData = {
      ...formData,
      date: getCurrentWIB(),
    }

    const url = '/api/activities'
    const method = editingId ? 'PUT' : 'POST'
    if (editingId) activityData.activity_id = editingId

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData),
    })

    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Sukses!',
        text: editingId ? 'Activity berhasil diperbarui!' : 'Activity berhasil ditambahkan!',
        showConfirmButton: false,
        timer: 1500
      })
      setFormData({ type: '', notes: '', assigned_to: '' })
      setEditingId(null)
      fetchActivities()
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: 'Terjadi kesalahan saat menyimpan activity.'
      })
    }
  }

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus activity ini?',
      text: 'Tindakan ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    })

    if (confirm.isConfirmed) {
      const res = await fetch('/api/activities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Dihapus!',
          text: 'Activity berhasil dihapus.',
          showConfirmButton: false,
          timer: 1500
        })
        fetchActivities()
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: 'Tidak bisa menghapus activity.'
        })
      }
    }
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

  const getUserName = (id) => users.find((u) => u.user_id === id)?.name || '-'

  const getActivityIcon = (type) => {
    switch(type) {
      case 'call': return <Phone className="w-4 h-4" />
      case 'meeting': return <UsersIcon className="w-4 h-4" />
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
          {editingId ? 'Edit Activity' : 'Add New Activity'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Select */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Activity Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 focus:border-blue-600'
                } outline-none`}
              >
                <option value="">-- Select Type --</option>
                <option value="call">📞 Call</option>
                <option value="meeting">👥 Meeting</option>
                <option value="email">📧 Email</option>
                <option value="follow-up">💬 Follow-Up</option>
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Assign To
              </label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 focus:border-blue-600'
                } outline-none`}
              >
                <option value="">-- Select User --</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Notes
            </label>
            <textarea
              name="notes"
              placeholder="Add activity notes or description..."
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors resize-none ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                  : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
              } outline-none`}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                editingId
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg hover:shadow-xl`}
            >
              {editingId ? (
                <>
                  <Save className="w-5 h-5" />
                  Update Activity
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Activity
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
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ACTIVITIES LIST */}
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Activities List ({activities.length})
          </h2>
        </div>

        {activities.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              No activities yet
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              Create your first activity above
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
                    Type
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Date & Time
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Assigned To
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Notes
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Actions
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
                        {getUserName(activity.assigned_to)}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Floating Chat Imported Here */}
      <FloatingChat />
    </div>
  )
}