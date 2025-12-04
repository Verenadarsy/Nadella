'use client'
import { useEffect, useState } from 'react'
import { showAlert } from '@/lib/sweetalert';
import {
  UsersRound, Edit2, Trash2, X, Save, Plus,
  User, Calendar, UserCog, ChevronDown, Clock
} from 'lucide-react'
import FloatingChat from "../floatingchat"
import { useLanguage } from '@/lib/languageContext'
import SectionLoader from '../components/sectionloader'

export default function TeamsPage() {
  const { language, t } = useLanguage()
  const texts = t.teams[language]
  const [teams, setTeams] = useState([])
  const [users, setUsers] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    team_id: '',
    team_name: '',
    manager_id: ''
  })
  const [managerOpen, setManagerOpen] = useState(false)

  useEffect(() => {
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
      setLoading(true)
      const res = await fetch('/api/teams')
      const data = await res.json()
      setTeams(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch teams error:', err)
    } finally {
      setLoading(false)
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
      showAlert({
        icon: 'warning',
        title: texts.warning,
        text: texts.teamNameRequired
      }, darkMode)
      return
    }

    try {
      const method = isEditing ? 'PUT' : 'POST'

      // Generate WIB timestamp for created_at
      const now = new Date()
      const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
      const createdAtWIB = wib.toISOString().slice(0, 19).replace('T', ' ')

      const payload = {
        team_name: formData.team_name,
        manager_id: formData.manager_id || null
      }

      if (isEditing) {
        payload.team_id = formData.team_id
      } else {
        payload.created_at = createdAtWIB  // ← ADD INI PAS CREATE BARU!
      }

      console.log('Sending payload:', payload)

      const res = await fetch('/api/teams', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      console.log('Response:', res.status, data)

      if (res.ok) {
        showAlert({
          icon: 'success',
          title: texts.success,
          text: isEditing ? texts.edited : texts.added,
          showConfirmButton: false,
          timer: 1500
        }, darkMode)
        setFormData({ team_id: '', team_name: '', manager_id: '' })
        setIsEditing(false)
        fetchTeams()
      } else {
        showAlert({
          icon: 'error',
          title: 'Failed',
          html: `<div style="text-align: left; font-size: 13px;">
            <strong>Error:</strong> ${JSON.stringify(data, null, 2)}
          </div>`,
          width: '600px'
        }, darkMode)
      }
    } catch (err) {
      console.error(err)
      showAlert({
        icon: 'error',
        title: texts.error,
        text: texts.connectionError
      }, darkMode)
    }
  }

  const handleEdit = (team) => {
    setFormData(team)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    const confirm = await showAlert({
      title: texts.deleteTeam,
      text: texts.cannotUndo,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: texts.yesDelete,
      cancelButtonText: texts.cancel,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode)

    if (confirm.isConfirmed) {
      try {
        const res = await fetch('/api/teams', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        })

        if (res.ok) {
          showAlert({
            icon: 'success',
            title: texts.deleted,
            text: texts.teamDeleted,
            showConfirmButton: false,
            timer: 1500
          }, darkMode)
          fetchTeams()
        } else {
          showAlert({
            icon: 'error',
            title: texts.failed,
            text: texts.unableToDelete
          }, darkMode)
        }
      } catch (err) {
        console.error(err)
        showAlert({
          icon: 'error',
          title: 'Error',
          text: 'A connection error occurred.'
        }, darkMode)
      }
    }
  }

  const getManagerName = (id) => {
    const manager = users.find((u) => u.user_id === id)
    return manager ? (manager.name || manager.username) : null
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
              {texts.editTeam}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {texts.addNewTeam}
            </>
          )}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.teamName}
              </label>
              <div className="relative">
                <UsersRound className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  darkMode ? 'text-slate-500' : 'text-slate-500'
                }`} />
                <input
                  type="text"
                  name="team_name"
                  placeholder={texts.teamNamePlaceholder}
                  value={formData.team_name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors outline-none ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                  }`}
                />
              </div>
            </div>

            {/* Manager Dropdown */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.manager}
              </label>

              <button
                type="button"
                onClick={() => setManagerOpen(!managerOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span className={`flex items-center gap-2 ${
                  formData.manager_id ? "opacity-90" : "opacity-60"
                }`}>
                  <UserCog size={16} className="opacity-60" />
                  {formData.manager_id
                    ? getManagerName(formData.manager_id)
                    : texts.selectManager}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {managerOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 max-h-60 overflow-y-auto ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  {/* Option for no manager */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, manager_id: '' })
                      setManagerOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                      darkMode ? "hover:bg-slate-600" : "hover:bg-slate-100"
                    }`}
                  >
                    <User size={16} className="opacity-50" />
                    <span className="opacity-60">{texts.noManager}</span>
                  </button>

                  {users.map((u) => (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, manager_id: u.user_id })
                        setManagerOpen(false)
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                        darkMode ? "hover:bg-slate-600" : "hover:bg-slate-100"
                      }`}
                    >
                      <UserCog size={16} className="opacity-70" />
                      {u.name || u.username}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                isEditing
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg hover:shadow-xl`}
            >
              {isEditing ? (
                <>
                  <Save className="w-5 h-5" />
                  {texts.updateTeam}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {texts.addTeam}
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
                {texts.cancel}
              </button>
            )}
          </div>
        </div>
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
            {texts.teamsList} ({teams.length})
          </h2>
        </div>

        {loading ? (
          <SectionLoader darkMode={darkMode} text={texts.loadingTeams} />
        ) : teams.length === 0 ? (
          <div className="p-12 text-center">
            <UsersRound className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {texts.noTeamsYet}
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
                    {texts.teamNameHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.managerHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.createdAt}
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.actions}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {teams.map((team) => {
                  const managerName = getManagerName(team.manager_id)
                  return (
                    <tr key={team.team_id} className={`transition-colors ${
                      darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                    }`}>
                      <td className={`px-6 py-4 text-sm ${
                        darkMode ? 'text-slate-300' : 'text-gray-900'
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
                          {managerName ? (
                            <>
                              <UserCog className="w-4 h-4" />
                              <span>{managerName}</span>
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 opacity-50" />
                              <span className="opacity-50">{texts.noManager}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        darkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {team.created_at
                            ? new Date(team.created_at).toLocaleString('id-ID', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Jakarta'
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