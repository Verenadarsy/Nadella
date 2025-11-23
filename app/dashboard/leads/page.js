"use client"
import { useEffect, useState } from "react"
import { showAlert } from '@/lib/sweetalert';
import FloatingChat from "../floatingchat"
import {
  UserPlus, Edit2, Trash2, X, Save, Plus,
  User, TrendingUp, Calendar, Clock,  ChevronDown, Phone, CheckCircle, XCircle, Sparkles
} from 'lucide-react'
import SectionLoader from '../components/sectionloader'

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [customers, setCustomers] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [form, setForm] = useState({
    customer_id: "",
    source: "",
    lead_status: "select"
});

  const [editingId, setEditingId] = useState(null)
  const [statusOpen, setStatusOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    // Detect dark mode from parent layout
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchLeads()
    fetchCustomers()

    return () => observer.disconnect()
  }, [])

  async function fetchLeads() {
    try {
      setLoading(true)  // ← TAMBAH INI
      const res = await fetch("/api/leads")
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to fetch leads:", err)
    } finally {
      setLoading(false)  // ← TAMBAH INI
    }
  }

  async function fetchCustomers() {
    try {
      const res = await fetch("/api/customers")
      const data = await res.json()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to fetch customers:", err)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.customer_id || !form.source || !form.lead_status) {
      showAlert({
        icon: 'warning',
        title: 'Warning!',
        text: 'Please fill in all required fields'
      }, darkMode)
      return
    }

    try {
      const method = editingId ? "PUT" : "POST"

      // Generate WIB timestamp for created_at
      const now = new Date()
      const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
      const createdAtWIB = wib.toISOString().slice(0, 19).replace('T', ' ')

      const body = editingId
        ? { ...form, lead_id: editingId }  // Edit: jangan tambahin created_at
        : { ...form, created_at: createdAtWIB }  // Create: tambahin created_at WIB

      console.log('📤 Sending lead data:', body)  // Debug

      const res = await fetch("/api/leads", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        throw new Error("Failed to save lead")
      }

      showAlert({
        icon: 'success',
        title: 'Success!',
        text: editingId ? 'Lead successfully updated!' : 'Lead successfully added!',
        showConfirmButton: false,
        timer: 1500
      }, darkMode)

      setForm({ customer_id: "", source: "", lead_status: "" })
      setEditingId(null)
      fetchLeads()
    } catch (err) {
      console.error(err)
      showAlert({
        icon: 'error',
        title: 'Failed!',
        text: 'An error occurred while saving the lead'
      }, darkMode)
    }
  }

  async function handleDelete(id) {
    const confirm = await showAlert({
      title: 'Delete this lead?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode)

    if (confirm.isConfirmed) {
      try {
        const res = await fetch("/api/leads", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        })
        if (!res.ok) throw new Error("Failed to delete lead")

        showAlert({
          icon: 'success',
          title: 'Deleted!',
          text: 'Lead successfully deleted.',
          showConfirmButton: false,
          timer: 1500
        }, darkMode)
        fetchLeads()
      } catch (err) {
        console.error(err)
        showAlert({
          icon: 'error',
          title: 'Failed!',
          text: 'Unable to delete the lead.'
        }, darkMode)
      }
    }
  }

  function handleEdit(lead) {
    setForm({
      customer_id: lead.customer_id || "",
      source: lead.source || "",
      lead_status: lead.lead_status || "new"
    })
    setEditingId(lead.lead_id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'new':
        return darkMode ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : 'bg-blue-100 text-blue-700 border-blue-200'
      case 'contacted':
        return darkMode ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'qualified':
        return darkMode ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-green-100 text-green-700 border-green-200'
      case 'disqualified':
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
          {editingId ? (
            <>
              <Edit2 className="w-5 h-5" />
              Edit Lead
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add New Lead
            </>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Select */}
            <div className="relative">
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Customer
              </label>

              <button
                type="button"
                onClick={() => setCustomerOpen(!customerOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}
              >
                <span
                  className={`flex items-center gap-2 ${
                    form.customer_id ? "opacity-90" : "opacity-60"
                  }`}
                >
                  <User size={16} className="opacity-60" />
                  {form.customer_id
                    ? customers.find((c) => c.customer_id === form.customer_id)?.name
                    : "Select Customer"}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {customerOpen && (
                <div
                  className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-200 text-slate-900"
                  }`}
                >
                  {customers.length === 0 && (
                    <div className="px-4 py-2 text-sm opacity-60">
                      No customers found
                    </div>
                  )}

                  {customers.map((c) => (
                    <button
                      key={c.customer_id}
                      onClick={() => {
                        setForm({ ...form, customer_id: c.customer_id });
                        setCustomerOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-100 ${
                        darkMode ? "hover:bg-slate-600" : ""
                      }`}
                    >
                      <User size={16} className="opacity-70" />
                      {c.name || "Unnamed Customer"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Source Input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Source
              </label>
              <div className="relative">
              <TrendingUp className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`} />
              <input
                type="text"
                name="address"
                placeholder="e.g., Website, Referral"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                    : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                } outline-none`}
              />
              </div>
            </div>

            {/* Status Select */}
            <div className="relative">
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Lead Status
              </label>

              <button
                type="button"
                onClick={() => setStatusOpen(!statusOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}
              >
                <span
                  className={`flex items-center gap-2 ${
                    form.lead_status === "select" ? "opacity-60" : "opacity-90"
                  }`}
                >
                  {/* hanya tampilkan icon jika sudah memilih */}
                  {form.lead_status !== "select" && (
                    <>
                      {form.lead_status === "new" && <Sparkles size={16} />}
                      {form.lead_status === "contacted" && <Phone size={16} />}
                      {form.lead_status === "qualified" && <CheckCircle size={16} />}
                      {form.lead_status === "disqualified" && <XCircle size={16} />}
                    </>
                  )}

                  {/* label */}
                  {form.lead_status === "select"
                    ? "Select Lead Status"
                    : form.lead_status.charAt(0).toUpperCase() +
                      form.lead_status.slice(1)}
                </span>

                <ChevronDown size={18} className="opacity-60" />
              </button>

              {statusOpen && (
                <div
                  className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-200 text-slate-900"
                  }`}
                >
                  {[
                    { value: "new", label: "New", icon: <Sparkles size={16} /> },
                    { value: "contacted", label: "Contacted", icon: <Phone size={16} /> },
                    { value: "qualified", label: "Qualified", icon: <CheckCircle size={16} /> },
                    { value: "disqualified", label: "Disqualified", icon: <XCircle size={16} /> },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        setForm({ ...form, lead_status: item.value });
                        setStatusOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-100 ${
                        darkMode ? "hover:bg-slate-600" : ""
                      }`}
                    >
                      {item.icon}
                      {item.label}
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
                editingId
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg hover:shadow-xl`}
            >
              {editingId ? (
                <>
                  <Save className="w-5 h-5" />
                  Update Lead
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Lead
                </>
              )}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm({ customer_id: "", source: "", lead_status: "new" })
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

      {/* LEADS LIST */}
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Leads List ({leads.length})
          </h2>
        </div>

        {loading ? (
          <SectionLoader darkMode={darkMode} text="Loading leads..." />
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              No leads yet
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              Create your first lead above
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
                    Customer
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Source
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Status
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
                {leads.map((lead) => (
                  <tr key={lead.lead_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {customers.find((c) => c.customer_id === lead.customer_id)?.name || "Unknown"}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        {lead.source}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${
                        getStatusColor(lead.lead_status)
                      }`}>
                        <span className="capitalize">{lead.lead_status}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(lead.created_at).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(lead)}
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
                          onClick={() => handleDelete(lead.lead_id)}
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