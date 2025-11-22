'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import {
  Megaphone, Edit2, Trash2, X, Save, Plus,
  Calendar, TrendingUp, Mail, Smartphone, Radio,
  Banknote, ChevronDown, Activity
} from 'lucide-react'
import FloatingChat from "../floatingchat"

export default function CampaignsPage() {
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

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchCampaigns()

    return () => observer.disconnect()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns')
      const data = await res.json()
      setCampaigns(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Fetch campaigns error:', error)
    }
  }

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.campaign_name || !formData.channel || !formData.start_date || !formData.end_date || !formData.budget) {
      Swal.fire({
        icon: 'warning',
        title: 'Peringatan!',
        text: 'Semua field wajib diisi.'
      })
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
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: `Campaign successfully ${isEditing ? 'edited' : 'added'}!`,
          showConfirmButton: false,
          timer: 1500
        })
        setFormData({ campaign_id: '', campaign_name: '', channel: '', start_date: '', end_date: '', budget: '' })
        setIsEditing(false)
        fetchCampaigns()
      } else {
        const err = await res.json()
        Swal.fire({
          icon: 'error',
          title: 'Failed!',
          text: err?.error ?? 'Unable to save the campaign.'
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'A connection error occurred.'
      })
      console.error(error)
    }
  }

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Delete this campaign?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    })

    if (confirm.isConfirmed) {
      const res = await fetch('/api/campaigns', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'The campaign has been successfully deleted.',
          showConfirmButton: false,
          timer: 1500
        })
        fetchCampaigns()
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed!',
          text: 'Unable to delete the campaign.'
        })
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
      case 'email': return <Mail className="w-4 h-4" />
      case 'ads': return <Radio className="w-4 h-4" />
      case 'sms': return <Smartphone className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
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
    { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
    { value: 'ads', label: 'Ads', icon: <Radio className="w-4 h-4" /> },
    { value: 'sms', label: 'SMS', icon: <Smartphone className="w-4 h-4" /> }
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
          {isEditing ? (
            <>
              <Edit2 className="w-5 h-5" />
              Edit Campaign
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add New Campaign
            </>
          )}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campaign Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Campaign Name
              </label>
              <div className="relative">
                <Megaphone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  darkMode ? "text-slate-500" : "text-slate-500"
                }`} />
                <input
                  type="text"
                  name="campaign_name"
                  placeholder="e.g., End Year Promo"
                  value={formData.campaign_name}
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

            {/* Channel Dropdown */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Channel
              </label>

              <button
                type="button"
                onClick={() => setChannelOpen(!channelOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
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
                      <Activity className="w-4 h-4" />
                      Select Channel
                    </>
                  )}
                </span>
                <ChevronDown size={18} className="opacity-60" />
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

            {/* Start Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-slate-300" : "text-slate-700"
              }`}>
                Start Date
              </label>

              <div
                className="relative cursor-pointer"
                onClick={() => document.getElementById("startDateInput").showPicker()}
              >
                <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                  darkMode ? "text-slate-500" : "text-slate-400"
                }`} />

                <input
                  id="startDateInput"
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />

                <div className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  <span className={formData.start_date ? "" : (darkMode ? "text-slate-500" : "text-slate-400")}>
                    {formData.start_date
                      ? new Date(formData.start_date + 'T00:00:00').toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : "dd/mm/yyyy"
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-slate-300" : "text-slate-700"
              }`}>
                End Date
              </label>

              <div
                className="relative cursor-pointer"
                onClick={() => document.getElementById("endDateInput").showPicker()}
              >
                <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                  darkMode ? "text-slate-500" : "text-slate-400"
                }`} />

                <input
                  id="endDateInput"
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />

                <div className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  <span className={formData.end_date ? "" : (darkMode ? "text-slate-500" : "text-slate-400")}>
                    {formData.end_date
                      ? new Date(formData.end_date + 'T00:00:00').toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : "dd/mm/yyyy"
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Budget (Rp)
              </label>
              <div className="relative">
                <Banknote className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  darkMode ? "text-slate-500" : "text-slate-500"
                }`} />
                <input
                  type="number"
                  name="budget"
                  placeholder="e.g., 10000000"
                  value={formData.budget}
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
                  Update Campaign
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Campaign
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
        </div>
      </div>

      {/* CAMPAIGNS LIST */}
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Campaigns List ({campaigns.length})
          </h2>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              No campaigns yet
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              Create your first campaign above
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
                    Campaign Name
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Channel
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Period
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Budget
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {campaigns.map((campaign) => (
                  <tr key={campaign.campaign_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4" />
                        <span className="font-medium">{campaign.campaign_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${
                        getChannelColor(campaign.channel)
                      }`}>
                        {getChannelIcon(campaign.channel)}
                        <span className="capitalize">{campaign.channel}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(campaign.start_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                          {' → '}
                          {new Date(campaign.end_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          Rp {Number(campaign.budget).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(campaign)}
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
                          onClick={() => handleDelete(campaign.campaign_id)}
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
      <FloatingChat />
    </div>
  )
}