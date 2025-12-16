'use client'
import { useEffect, useState } from 'react'
import { showAlert } from '@/lib/sweetalert';
import {
  FileText, Edit2, Trash2, X, Save, Plus,
  Banknote, Calendar, User, Clock, AlertCircle, CheckCircle, ChevronDown, Search
} from 'lucide-react'
import SectionLoader from '../components/sectionloader'
import { useLanguage } from '@/lib/languageContext'

export default function InvoicesPage() {
  const { language, t } = useLanguage()
  const texts = t.invoices[language]
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    invoice_id: '',
    customer_id: '',
    amount: '',
    due_date: '',
    status: '',
  })
  const [customerOpen, setCustomerOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    const roleCookie = document.cookie
      .split("; ")
      .find((r) => r.startsWith("userRole="))
      ?.split("=")[1];

    setUserRole(roleCookie);
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchInvoices()
    fetchCustomers()

    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setCustomerOpen(false)
        setStatusOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      observer.disconnect()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter invoices berdasarkan search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredInvoices(invoices)
    } else {
      const filtered = invoices.filter((invoice) => {
        const customerName = getCustomerName(invoice.customer_id).toLowerCase()
        const amount = invoice.amount?.toString() || ""
        const status = invoice.status?.toLowerCase() || ""
        const dueDate = invoice.due_date || ""

        return (
          customerName.includes(searchQuery.toLowerCase()) ||
          amount.includes(searchQuery) ||
          status.includes(searchQuery.toLowerCase()) ||
          dueDate.includes(searchQuery)
        )
      })
      setFilteredInvoices(filtered)
    }
  }, [searchQuery, invoices])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/invoices')
      const data = await res.json()
      const invoicesData = Array.isArray(data) ? data : []  // ← TAMBAH BARIS INI
      setInvoices(invoicesData)  // ← UBAH JADI INI
      setFilteredInvoices(invoicesData)  // ← TAMBAH BARIS INI
    } catch (err) {
      console.error('Error fetching invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching customers:', err)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()



    // Validasi
    if (isEditing && userRole === 'admin') {
      // Admin cuma perlu isi status
      if (!formData.status) {
        showAlert({
          icon: 'warning',
          title: texts.warning,
          text: 'Pilih status terlebih dahulu!'
        }, darkMode)
        return
      }
    } else {
      // User biasa harus isi semua
      if (!formData.customer_id || !formData.amount || !formData.due_date || !formData.status) {
        showAlert({
          icon: 'warning',
          title: texts.warning,
          text: texts.fillAllFields
        }, darkMode)
        return
      }
    }

    const method = isEditing ? 'PUT' : 'POST'

    // Generate WIB timestamp for created_at (pas create baru aja)
    const now = new Date()
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    const createdAtWIB = wib.toISOString().slice(0, 19).replace('T', ' ')

    // BUAT PAYLOAD YANG PROPER
    const payload = isEditing
      ? (userRole === 'admin'
          ? {
              // Admin cuma update status
              invoice_id: formData.invoice_id,
              status: formData.status,
            }
          : {
              // User biasa update semua
              invoice_id: formData.invoice_id,
              customer_id: formData.customer_id,
              amount: parseFloat(formData.amount),
              due_date: formData.due_date,
              status: formData.status,
            }
        )
      : {
          // Create baru (cuma user biasa yang bisa)
          customer_id: formData.customer_id,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          status: formData.status,
          created_at: createdAtWIB
        }

    console.log('Sending invoice data:', payload)

    try {
      const response = await fetch('/api/invoices', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log('Response:', response.status, data)

      if (!response.ok) {
        showAlert({
          icon: 'error',
          title: 'Error!',
          html: `<div style="text-align: left; font-size: 13px;">
            <strong>Status:</strong> ${response.status}<br>
            <strong>Error:</strong> ${JSON.stringify(data, null, 2)}
          </div>`,
          width: '600px'
        }, darkMode)
        return
      }

      showAlert({
        icon: 'success',
        title: texts.success,
        text: `Invoice successfully ${isEditing ? texts.invoiceUpdated : texts.invoiceAdded}!`,
        showConfirmButton: false,
        timer: 1500
      }, darkMode)

      setFormData({
        invoice_id: '',
        customer_id: '',
        amount: '',
        due_date: '',
        status: '',
      })
      setIsEditing(false)
      fetchInvoices()

    } catch (error) {
      console.error('Fetch error:', error)
      showAlert({
        icon: 'error',
        title: texts.error,
        text: texts.errorSaving
      }, darkMode)
    }
  }

  const handleEdit = (invoice) => {
    setFormData(invoice)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id) => {
    if (userRole === 'admin') {
      showAlert({
        icon: 'error',
        title: texts.accessDenied || 'Akses Ditolak',
        text: 'Hanya Superadmin yang dapat menghapus invoice'
      }, darkMode);
      return;
    }

    showAlert({
      title: texts.deleteInvoice,
      text: texts.cannotUndo,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: texts.yesDelete,
      cancelButtonText: texts.cancel,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode).then(confirm => {
      if (confirm.isConfirmed) {
        fetch('/api/invoices', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        }).then(res => {
          if (res.ok) {
            showAlert({
              icon: 'success',
              title: texts.deleted,
              text: texts.invoiceDeleted,
              showConfirmButton: false,
              timer: 1500
            }, darkMode)
            fetchInvoices()
          } else {
            showAlert({
              icon: 'error',
              title: texts.error,
              text: texts.errorToDelete
            }, darkMode)
          }
        })
      }
    })
  }

  const handleCancel = () => {
    setFormData({
      invoice_id: '',
      customer_id: '',
      amount: '',
      due_date: '',
      status: '',
    })
    setIsEditing(false)
  }

  const getCustomerName = (id) =>
    customers.find((c) => c.customer_id === id)?.name || '-'

  const getStatusIcon = (status) => {
    switch(status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />
      case 'overdue': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid':
        return darkMode ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-green-100 text-green-700 border-green-200'
      case 'overdue':
        return darkMode ? 'bg-red-600/20 text-red-400 border-red-600/30' : 'bg-red-100 text-red-700 border-red-200'
      case 'pending':
        return darkMode ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return darkMode ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const statusOptions = [
    { value: 'pending', label: texts.pending, icon: <Clock className="w-4 h-4" /> },
    { value: 'paid', label: texts.paid, icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'overdue', label: texts.overdue, icon: <AlertCircle className="w-4 h-4" /> }
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
              {userRole === 'admin' ? 'Update Status Invoice' : texts.editInvoice}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {texts.addNewInvoice}
            </>
          )}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer */}
            <div className="relative dropdown-container">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.customer}
              </label>

              <button
                type="button"
                onClick={() => setCustomerOpen(!customerOpen)}
                disabled={userRole === 'admin' && isEditing}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  userRole === 'admin' && isEditing
                    ? (darkMode ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed')
                    : (darkMode
                      ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500"
                      : "bg-slate-50 border-gray-200 text-slate-900 focus:border-blue-600")
                }`}
              >
                <span className={`flex items-center gap-2 ${
                  formData.customer_id ? "" : "opacity-60"
                }`}>
                  <User size={16} className="opacity-60" />
                  {formData.customer_id
                    ? customers.find((c) => c.customer_id === formData.customer_id)?.name
                    : texts.selectCustomer}
                </span>
                <ChevronDown size={18} className={`opacity-60 transition-transform ${customerOpen ? 'rotate-180' : ''}`} />
              </button>

              {customerOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                  darkMode
                    ? "bg-slate-700 border-slate-600"
                    : "bg-white border-gray-200"
                }`}>
                  {/* Search Input */}
                  <div className="p-2 border-b-2" style={{ borderColor: darkMode ? '#475569' : '#E2E8F0' }}>
                    <div className="relative">
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder={texts.searchCustomers}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 transition-colors outline-none ${
                          darkMode
                            ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400 focus:border-blue-500'
                            : 'bg-gray-50 border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Search className={`absolute left-3 top-2.5 w-5 h-5 pointer-events-none ${
                        darkMode ? 'text-slate-400' : 'text-slate-400'
                      }`} />
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-60 overflow-y-auto" style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}>
                    <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
                    {customers
                      .filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                      .map((c) => (
                        <button
                          key={c.customer_id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, customer_id: c.customer_id })
                            setCustomerOpen(false)
                            setCustomerSearch('')
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                            formData.customer_id === c.customer_id
                              ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                              : (darkMode ? "hover:bg-slate-600 text-white" : "hover:bg-slate-100 text-slate-900")
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

            {/* Amount */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.amount} (Rp)
              </label>
              <div className="relative">
                <Banknote className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  darkMode ? "text-slate-500" : "text-slate-500"
                }`} />
                <input
                  type="number"
                  name="amount"
                  placeholder={texts.amountPlaceholder}
                  value={formData.amount}
                  onChange={handleChange}
                  disabled={userRole === 'admin' && isEditing}
                  required
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors outline-none ${
                    userRole === 'admin' && isEditing
                      ? (darkMode ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed')
                      : (darkMode
                        ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                        : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600")
                  }`}
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.dueDate}
              </label>
              <div className="relative cursor-pointer"
                onClick={() => {
                  if (!(userRole === 'admin' && isEditing)) {
                    document.getElementById("dueDateInput").showPicker()
                  }
                }}
              >
                <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                  darkMode ? "text-slate-500" : "text-slate-400"
                }`} />

                <input
                  id="dueDateInput"
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  disabled={userRole === 'admin' && isEditing}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />

                <div className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                  userRole === 'admin' && isEditing
                    ? (darkMode ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed')
                    : (darkMode
                      ? "bg-slate-700 border-slate-600 text-white"
                      : "bg-white border-gray-200 text-slate-900")
                }`}>
                  <span className={formData.due_date ? "" : (darkMode ? "text-slate-500" : "text-slate-400")}>
                    {formData.due_date
                      ? new Date(formData.due_date + 'T00:00:00').toLocaleDateString('id-ID', {
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

            {/* Status */}
            <div className="relative dropdown-container">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.status}
              </label>

              <button
                type="button"
                onClick={() => setStatusOpen(!statusOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span className={`flex items-center gap-2 ${
                  formData.status ? "opacity-90" : "opacity-60"
                }`}>
                  {formData.status ? (
                    <>
                      {statusOptions.find(s => s.value === formData.status)?.icon}
                      {statusOptions.find(s => s.value === formData.status)?.label}
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      {texts.selectStatus}
                    </>
                  )}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {statusOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, status: option.value })
                        setStatusOpen(false)
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
                  {userRole === 'admin' ? 'Update Status' : texts.updateInvoice}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {texts.addInvoice}
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
        </div>
      </div>

      {/* INVOICES LIST */}
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className={`text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {texts.invoicesList} ({filteredInvoices.length})
            </h2>

            {/* Search Bar */}
            <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={texts.searchInvoices}
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
          <SectionLoader darkMode={darkMode} text={texts.loadingInvoices} />
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {searchQuery ? (texts.noResults || 'Tidak ada hasil yang ditemukan') : texts.noInvoicesYet}
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {searchQuery ? (texts.tryDifferentKeyword || 'Coba kata kunci lain') : texts.createFirst}
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
                    {texts.customerHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.amountHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.dueDateHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.statusHeader}
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
                {filteredInvoices.map((i) => (
                  <tr key={i.invoice_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {getCustomerName(i.customer_id)}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          Rp {Number(i.amount).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {i.due_date
                          ? new Date(i.due_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${
                        getStatusColor(i.status)
                      }`}>
                        {getStatusIcon(i.status)}
                          <span className="capitalize">{texts[i.status]}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(i.created_at).toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(i)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          }`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {userRole !== 'admin' && (
                          <button
                            onClick={() => handleDelete(i.invoice_id)}
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
    </div>
  )
}