'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import {
  Handshake, Edit2, Trash2, X, Save, Plus,
  Banknote, Calendar, User, Building2, TrendingUp, ChevronDown
} from 'lucide-react'
import FloatingChat from "../floatingchat"

export default function DealsPage() {
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

  useEffect(() => {
    // Detect dark mode from parent layout
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchDeals()
    fetchCustomers()
    fetchCompanies()

    return () => observer.disconnect()
  }, [])

  const fetchDeals = async () => {
    const res = await fetch('/api/deals')
    const data = await res.json()
    setDeals(Array.isArray(data) ? data : [])
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
      Swal.fire({
        icon: 'success',
        title: 'Sukses!',
        text: isEditing ? 'Deal berhasil diperbarui!' : 'Deal berhasil ditambahkan!',
        showConfirmButton: false,
        timer: 1500
      })
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
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: 'Tidak bisa menyimpan deal.'
      })
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
    const confirm = await Swal.fire({
      title: 'Hapus deal ini?',
      text: 'Tindakan ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    })

    if (confirm.isConfirmed) {
      const res = await fetch('/api/deals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Dihapus!',
          text: 'Deal berhasil dihapus.',
          showConfirmButton: false,
          timer: 1500
        })
        fetchDeals()
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: 'Tidak bisa menghapus deal.'
        })
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
              Edit Deal
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add New Deal
            </>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deal Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Deal Name
            </label>

            <div className="relative">
              <Handshake className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-slate-500" : "text-slate-500"}`} />

              <input
                type="text"
                name="deal_name"
                placeholder="e.g., Enterprise Software License"
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
                Deal Stage
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
                  {formData.deal_stage ? formData.deal_stage : "Select Stage"}
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
                      <span className="capitalize">{item}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>


            {/* Deal Value */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Deal Value (Rp)
              </label>

              <div className="relative">
                <Banknote className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-slate-500" : "text-slate-500"}`} />

                <input
                  type="number"
                  name="deal_value"
                  placeholder="e.g., 50000000"
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
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Expected Close Date
              </label>

              <div
                className="relative cursor-pointer"
                onClick={() => document.getElementById("expectedCloseDateInput").showPicker()}
              >

                {/* ICON KIRI */}
                <Calendar
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                    darkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                />

                {/* INPUT DATE (HIDDEN) */}
                <input
                  id="expectedCloseDateInput"
                  type="date"
                  name="expected_close_date"
                  value={formData.expected_close_date}
                  onChange={handleChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />

                {/* VISUAL INPUT */}
                <div className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  <span className={formData.expected_close_date ? "" : (darkMode ? "text-slate-500" : "text-slate-400")}>
                    {formData.expected_close_date
                      ? new Date(formData.expected_close_date + 'T00:00:00').toLocaleDateString('id-ID', {
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




            {/* Customer Select */}
            <div className="relative">
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Customer
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
                    : "Select Customer"}
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
                  {customers.map((c) => (
                    <button
                      key={c.customer_id}
                      onClick={() => {
                        setFormData({ ...formData, customer_id: c.customer_id });
                        setCustomerOpen(false);
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
              )}
            </div>


            {/* Company */}
            <div className="relative">
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Company
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
                    : "Select Company"}
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
                  {companies.map((c) => (
                    <button
                      key={c.company_id}
                      onClick={() => {
                        setFormData({ ...formData, company_id: c.company_id });
                        setCompanyOpen(false);
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
                  Update Deal
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Deal
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
                Cancel
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
          <h2 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Deals List ({deals.length})
          </h2>
        </div>

        {deals.length === 0 ? (
          <div className="p-12 text-center">
            <Handshake className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              No deals yet
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              Create your first deal above
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
                    Deal Name
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Stage
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Value
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Customer
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Company
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Close Date
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {deals.map((deal) => (
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
                        <span className="capitalize">{deal.deal_stage}</span>
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
                        <User className="w-4 h-4" />
                        {getCustomerName(deal.customer_id)}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
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