"use client"
import { useEffect, useState } from "react"
import { showAlert } from '@/lib/sweetalert';
import FloatingChat from "../floatingchat"
import {
  UserPlus, Edit2, Trash2, X, Save, Plus,
  User, TrendingUp, Clock, ChevronDown, Phone, CheckCircle, XCircle, Sparkles, FileText, Mail, Key
} from 'lucide-react'
import SectionLoader from '../components/sectionloader'
import { useLanguage } from '@/lib/languageContext'

export default function LeadsPage() {
  const { language, t } = useLanguage()
  const texts = t.leads[language]
  const [leads, setLeads] = useState([])
  const [customers, setCustomers] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [form, setForm] = useState({
    lead_name: "",
    customer_id: null,
    source: "",
    lead_status: "new"
  });

  const [editingId, setEditingId] = useState(null)
  const [statusOpen, setStatusOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // ============================================
  // TAMBAHAN: State untuk pop-up email
  // ============================================
  const [showEmailPopup, setShowEmailPopup] = useState(false)
  const [emailForm, setEmailForm] = useState({ customer_id: '', email: '' })

  useEffect(() => {
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
      setLoading(true)
      const res = await fetch("/api/leads")
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to fetch leads:", err)
    } finally {
      setLoading(false)
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

  // ============================================
  // UPDATE: handleSubmit dengan email logic
  // ============================================
  async function handleSubmit(e) {
    e.preventDefault()

    // Validation
    if (!form.lead_name || !form.source || !form.lead_status) {
      showAlert({
        icon: 'warning',
        title: texts.warning,
        text: texts.fillAllFields
      }, darkMode)
      return
    }

    try {
      const method = editingId ? "PUT" : "POST"

      // Generate WIB timestamp
      const now = new Date()
      const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
      const createdAtWIB = wib.toISOString().slice(0, 19).replace('T', ' ')

      const body = editingId
        ? { ...form, lead_id: editingId }
        : { ...form, created_at: createdAtWIB }

      console.log('Sending lead data:', body)

      const res = await fetch("/api/leads", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        throw new Error("Failed to save lead")
      }

      const result = await res.json()
      console.log('🔍 Backend response:', result)

      // ========================================
      // CHECK IF EMAIL INPUT IS NEEDED
      // ========================================
      if (result.needEmailInput && result.customer_id) {
        console.log('⏳ Email input needed for customer:', result.customer_id)

        // Show pop-up untuk input email
        setEmailForm({
          customer_id: result.customer_id,  // ← customer_id dari backend
          email: ''
        })
        setShowEmailPopup(true)

      } else {
        // Normal success (no email needed)
        showAlert({
          icon: 'success',
          title: texts.success,
          text: editingId ? texts.leadUpdated : texts.leadAdded,
          showConfirmButton: false,
          timer: 1500
        }, darkMode)
      }

      setForm({ lead_name: "", customer_id: null, source: "", lead_status: "new" })
      setEditingId(null)
      fetchLeads()

    } catch (err) {
      console.error(err)
      showAlert({
        icon: 'error',
        title: texts.failed,
        text: texts.errorSavingLead
      }, darkMode)
    }
  }

  // ============================================
  // TAMBAHAN: Handle email submit
  // ============================================
  async function handleEmailSubmit(e) {
    e.preventDefault()

    if (!emailForm.email) {
      showAlert({
        icon: 'warning',
        title: 'Email Required',
        text: 'Please enter customer email address'
      }, darkMode)
      return
    }

    // Debug: cek data yang dikirim
    console.log('📧 Sending email data:', emailForm)

    try {
      const res = await fetch('/api/customers/generate-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm)
      })

      const result = await res.json()
      console.log('📬 Server response:', result)

      if (!res.ok) {
        throw new Error(result.error || 'Failed to generate user')
      }

      showAlert({
        icon: 'success',
        title: 'User Generated!',
        html: `<div class="text-center">
          <p class="mb-2">User account has been created and credentials sent to:</p>
          <p class="font-semibold text-blue-600 dark:text-blue-400">${emailForm.email}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Customer can now login to their account.</p>
        </div>`,
        timer: 3000,
        showConfirmButton: false
      }, darkMode)

      setShowEmailPopup(false)
      setEmailForm({ customer_id: '', email: '' })
      fetchLeads()

    } catch (err) {
      console.error('❌ Email submit error:', err)
      showAlert({
        icon: 'error',
        title: 'Failed',
        text: err.message || 'Failed to generate user account'
      }, darkMode)
    }
  }

  async function handleDelete(id) {
    const confirm = await showAlert({
      title: texts.deleteLead,
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
        const res = await fetch("/api/leads", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        })
        if (!res.ok) throw new Error("Failed to delete lead")

        showAlert({
          icon: 'success',
          title: texts.deleted,
          text: texts.leadDeleted,
          showConfirmButton: false,
          timer: 1500
        }, darkMode)
        fetchLeads()
      } catch (err) {
        console.error(err)
        showAlert({
          icon: 'error',
          title: texts.failed,
          text: texts.errorDeletingLead
        }, darkMode)
      }
    }
  }

  function handleEdit(lead) {
    setForm({
      lead_name: lead.lead_name || "",
      customer_id: lead.customer_id || null,
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
              {texts.editLead}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {texts.addNewLead}
            </>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lead Name Input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.leadName || "Lead Name"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  placeholder={texts.leadNamePlaceholder || "e.g., John Doe"}
                  value={form.lead_name}
                  onChange={(e) => setForm({ ...form, lead_name: e.target.value })}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                      : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                  } outline-none`}
                  required
                />
              </div>
            </div>

            {/* Source Input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.source} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <TrendingUp className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  placeholder={texts.sourcePlaceholder}
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                      : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                  } outline-none`}
                  required
                />
              </div>
            </div>

            {/* Status Select */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-slate-300" : "text-slate-700"
              }`}>
                {texts.leadStatus} <span className="text-red-500">*</span>
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
                <span className="flex items-center gap-2 opacity-90">
                  {form.lead_status === "new" && <Sparkles size={16} />}
                  {form.lead_status === "contacted" && <Phone size={16} />}
                  {form.lead_status === "qualified" && <CheckCircle size={16} />}
                  {form.lead_status === "disqualified" && <XCircle size={16} />}
                  {texts[form.lead_status]}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {statusOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  {[
                    { value: "new", label: texts.new, icon: <Sparkles size={16} /> },
                    { value: "contacted", label: texts.contacted, icon: <Phone size={16} /> },
                    { value: "qualified", label: texts.qualified, icon: <CheckCircle size={16} /> },
                    { value: "disqualified", label: texts.disqualified, icon: <XCircle size={16} /> },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
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

            {/* Customer Select */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-slate-300" : "text-slate-700"
              }`}>
                {texts.linkedCustomer || "Linked Customer"} <span className="text-slate-400 text-xs">(Optional)</span>
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
                <span className={`flex items-center gap-2 ${
                  form.customer_id ? "opacity-90" : "opacity-60"
                }`}>
                  <User size={16} className="opacity-60" />
                  {form.customer_id
                    ? customers.find((c) => c.customer_id === form.customer_id)?.name
                    : texts.noCustomerLinked || "Not linked yet"}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {customerOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, customer_id: null });
                      setCustomerOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-100 italic opacity-60 ${
                      darkMode ? "hover:bg-slate-600" : ""
                    }`}
                  >
                    <X size={16} />
                    {texts.clearSelection || "Clear selection"}
                  </button>

                  {customers.map((c) => (
                    <button
                      key={c.customer_id}
                      type="button"
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
          </div>

          {/* Info Box */}
          <div className={`p-4 rounded-lg border-l-4 ${
            darkMode
              ? 'bg-blue-900/20 border-blue-500 text-blue-300'
              : 'bg-blue-50 border-blue-500 text-blue-700'
          }`}>
            <p className="text-sm">
              💡 <strong>Tip:</strong> {texts.leadTip || "Lead will auto-generate Customer & User when status is changed to 'Qualified'"}
            </p>
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
                  {texts.updateLead}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {texts.addLead}
                </>
              )}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm({ lead_name: "", customer_id: null, source: "", lead_status: "new" })
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
            {texts.leadsList} ({leads.length})
          </h2>
        </div>

        {loading ? (
          <SectionLoader darkMode={darkMode} text={texts.loadingLeads} />
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {texts.noLeadsYet}
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
                    {texts.leadNameHeader || "Lead Name"}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.sourceHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.statusHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.linkedCustomerHeader || "Linked Customer"}
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
                {leads.map((lead) => (
                  <tr key={lead.lead_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      darkMode ? 'text-slate-200' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {lead.lead_name || texts.unnamed}
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
                        <span className="capitalize">{texts[lead.lead_status]}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      {lead.customer_id ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-500" />
                          {customers.find((c) => c.customer_id === lead.customer_id)?.name || texts.unknown}
                        </div>
                      ) : (
                        <span className="italic opacity-50">
                          {texts.notLinked || "Not linked"}
                        </span>
                      )}
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

      {/* ============================================ */}
      {/* TAMBAHAN: Email Input Pop-up Modal */}
      {/* ============================================ */}
      {showEmailPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-2xl ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              darkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-xl font-bold ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Enter Customer Email
              </h2>
              <button
                onClick={() => {
                  setShowEmailPopup(false)
                  setEmailForm({ customer_id: '', email: '' })
                }}
                className={`p-1 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleEmailSubmit} className="p-6 space-y-4">
              <div className={`p-4 rounded-lg ${
                darkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
              }`}>
                <p className="text-sm">
                  <strong>ℹ️ Info:</strong> Customer account created successfully!
                  Enter their email address to generate login credentials.
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Customer Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                    required
                    className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                        : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                    } outline-none`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Key className="w-5 h-5" />
                Generate User Account
              </button>
            </form>
          </div>
        </div>
      )}

      <FloatingChat />
    </div>
  )
}