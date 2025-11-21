'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import {
  UsersRound, Edit2, Trash2, X, Save, Plus,
  User, Calendar, UserCog
} from 'lucide-react'
import FloatingChat from "../floatingchat"

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [users, setUsers] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    team_id: '',
    team_name: '',
    manager_id: ''
  })

  useEffect(() => {
    // Detect dark mode from parent layout
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchTeams()
    fetchUsers()

    return () => observer.disconnect()
  }, [])

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams')
      const data = await res.json()
      setTeams(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch teams error:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch users error:', err)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.team_name) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan',
        text: 'Nama tim wajib diisi'
      })
      return
    }

    try {
      const method = isEditing ? 'PUT' : 'POST'
      const body = JSON.stringify(formData)
      const res = await fetch('/api/teams', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      })

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Sukses!',
          text: `Tim berhasil ${isEditing ? 'diedit' : 'ditambahkan'}!`,
          showConfirmButton: false,
          timer: 1500
        })
        setFormData({ team_id: '', team_name: '', manager_id: '' })
        setIsEditing(false)
        fetchTeams()
      } else {
        const err = await res.json()
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err?.error ?? 'Operasi gagal.'
        })
      }
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan koneksi.'
      })
    }
  }

  const handleEdit = (team) => {
    setFormData(team)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus tim ini?',
      text: 'Tindakan ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    })

    if (confirm.isConfirmed) {
      try {
        const res = await fetch('/api/teams', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        })

        if (res.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Dihapus!',
            text: 'Tim berhasil dihapus.',
            showConfirmButton: false,
            timer: 1500
          })
          fetchTeams()
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Gagal',
            text: 'Tidak bisa menghapus tim.'
          })
        }
      } catch (err) {
        console.error(err)
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Terjadi kesalahan koneksi.'
        })
      }
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
          {isEditing ? (
            <>
              <Edit2 className="w-5 h-5" />
              Edit Team
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add New Team
            </>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Team Name
              </label>
              <div className="relative">
                <UsersRound className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  name="team_name"
                  placeholder="e.g., Marketing Team"
                  value={formData.team_name}
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

            {/* Manager Select */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Manager
              </label>
              <select
                name="manager_id"
                value={formData.manager_id}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 focus:border-blue-600'
                } outline-none`}
              >
                <option value="">-- Select Manager --</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name || u.username}
                  </option>
                ))}
              </select>
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
                  Update Team
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Team
                </>
              )}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setFormData({ team_id: '', team_name: '', manager_id: '' })
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

      {/* TEAMS LIST */}
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Teams List ({teams.length})
          </h2>
        </div>

        {teams.length === 0 ? (
          <div className="p-12 text-center">
            <UsersRound className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              No teams yet
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              Create your first team above
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
                    Team Name
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Manager
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Created At
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {teams.map((team) => {
                  const manager = users.find((u) => u.user_id === team.manager_id)
                  return (
                    <tr key={team.team_id} className={`transition-colors ${
                      darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                    }`}>
                      <td className={`px-6 py-4 text-sm ${
                        darkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        <div className="flex items-center gap-2">
                          <UsersRound className="w-4 h-4" />
                          <span className="font-medium">{team.team_name}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        darkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        <div className="flex items-center gap-2">
                          {manager ? (
                            <>
                              <UserCog className="w-4 h-4" />
                              <span>{manager.name || manager.username}</span>
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 opacity-50" />
                              <span className="opacity-50">-</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        darkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {team.created_at
                            ? new Date(team.created_at).toLocaleString('id-ID', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(team)}
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
                            onClick={() => handleDelete(team.team_id)}
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <FloatingChat />
    </div>
  )
}