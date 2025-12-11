'use client'
import { useEffect, useState } from 'react'
import { showAlert } from '@/lib/sweetalert';
import {
  Ticket, Edit2, Trash2, X, Save, Plus,
  User, Clock, AlertTriangle, CheckCircle, Circle, Loader, ChevronDown, FileText, Target, Activity,
  Flag, TrendingUp, Zap, ArrowRight, Search
} from 'lucide-react'
import FloatingChat from "../floatingchat"
import SectionLoader from '../components/sectionloader'
import { useLanguage } from '@/lib/languageContext'

// Dapetin waktu real-time dalam format "YYYY-MM-DD HH:mm:ss" WIB
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

export default function TicketsPage() {
  const { language, t } = useLanguage()
  const texts = t.tickets[language]
  const [tickets, setTickets] = useState([])
  const [users, setUsers] = useState([])
  const [customers, setCustomers] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    ticket_id: '',
    customer_id: '',
    issue_type: '',
    status: '',
    priority: '',
    assigned_to: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [assignedOpen, setAssignedOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [assignedSearch, setAssignedSearch] = useState("");

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchTickets()
    fetchUsers()
    fetchCustomers()

    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setCustomerOpen(false)
        setPriorityOpen(false)
        setStatusOpen(false)
        setAssignedOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      observer.disconnect()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter tickets berdasarkan search query
    useEffect(() => {
      if (searchQuery.trim() === "") {
        setFilteredTickets(tickets);
      } else {
        const filtered = tickets.filter((ticket) => {
          const customerName = getCustomerName(ticket.customer_id).toLowerCase();
          const assignedName = getUserName(ticket.assigned_to).toLowerCase();
          const issueType = ticket.issue_type?.toLowerCase() || "";
          const status = ticket.status?.toLowerCase() || "";
          const priority = ticket.priority?.toLowerCase() || "";

          return (
            customerName.includes(searchQuery.toLowerCase()) ||
            assignedName.includes(searchQuery.toLowerCase()) ||
            issueType.includes(searchQuery.toLowerCase()) ||
            status.includes(searchQuery.toLowerCase()) ||
            priority.includes(searchQuery.toLowerCase())
          );
        });
        setFilteredTickets(filtered);
      }
    }, [searchQuery, tickets]);

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/tickets')
      const data = await res.json()
      const ticketsData = Array.isArray(data) ? data : []
      setTickets(ticketsData)
      setFilteredTickets(ticketsData)
    } catch (err) {
      console.error('Error fetching tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter tickets berdasarkan search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTickets(tickets);
    } else {
      const filtered = tickets.filter((ticket) => {
        const customerName = getCustomerName(ticket.customer_id).toLowerCase();
        const assignedName = getUserName(ticket.assigned_to).toLowerCase();
        const issueType = ticket.issue_type?.toLowerCase() || "";
        const status = ticket.status?.toLowerCase() || "";
        const priority = ticket.priority?.toLowerCase() || "";

        return (
          customerName.includes(searchQuery.toLowerCase()) ||
          assignedName.includes(searchQuery.toLowerCase()) ||
          issueType.includes(searchQuery.toLowerCase()) ||
          status.includes(searchQuery.toLowerCase()) ||
          priority.includes(searchQuery.toLowerCase())
        );
      });
      setFilteredTickets(filtered);
    }
  }, [searchQuery, tickets]);


  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users?role=admin')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching users:', err)
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

    // VALIDASI LENGKAP
    if (!formData.customer_id) {
      showAlert({
        icon: 'error',
        title: texts.customerRequired,
        text: texts.pleaseSelectCustomer
      }, darkMode)
      return
    }

    if (!formData.issue_type || formData.issue_type.trim() === '') {
      showAlert({
        icon: 'error',
        title: texts.issueTypeRequired,
        text: texts.pleaseEnterIssueType
      }, darkMode)
      return
    }

    if (!formData.priority) {
      showAlert({
        icon: 'error',
        title: texts.priorityRequired,
        text: texts.pleaseSelectPriority
      }, darkMode)
      return
    }

    if (!formData.status) {
      showAlert({
        icon: 'error',
        title: texts.statusRequired,
        text: texts.pleaseSelectStatus
      }, darkMode)
      return
    }

    const method = isEditing ? 'PUT' : 'POST'
    const url = '/api/tickets'

    // BUAT PAYLOAD YANG BERSIH - PASTIIN INTEGER!
    const payload = isEditing
      ? {
          ticket_id: formData.ticket_id,
          customer_id: formData.customer_id,
          issue_type: formData.issue_type.trim(),
          status: formData.status,
          priority: formData.priority,
          assigned_to: formData.assigned_to || null,
        }
      : {
          customer_id: formData.customer_id,
          issue_type: formData.issue_type.trim(),
          status: formData.status,
          priority: formData.priority,
          assigned_to: formData.assigned_to || null,
          created_at: getCurrentWIB()
        }

    console.log('📤 Sending payload:', payload)

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('Response status:', response.status)

      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        showAlert({
          icon: 'error',
          title: texts.backendError,
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
        text: isEditing ? texts.ticketUpdated : texts.ticketAdded,
        showConfirmButton: false,
        timer: 1500
      }, darkMode)

      setFormData({
        ticket_id: '',
        customer_id: '',
        issue_type: '',
        status: '',
        priority: '',
        assigned_to: '',
      })
      setIsEditing(false)
      fetchTickets()

    } catch (error) {
      console.error('❌ Fetch error:', error)
      showAlert({
        icon: 'error',
        title: texts.networkError,
        text: error.message
      }, darkMode)
    }
  }

  const handleEdit = (ticket) => {
    setFormData(ticket)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id) => {
    showAlert({
      title: texts.deleteTicket,
      text: texts.cannotUndo,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: texts.yesDelete,
      cancelButtonText: texts.cancel,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode).then(confirm => {
      if (confirm.isConfirmed) {
        fetch('/api/tickets', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        }).then(res => {
          if (res.ok) {
            showAlert({
              icon: 'success',
              title: texts.deleted,
              text: texts.ticketDeleted,
              showConfirmButton: false,
              timer: 1500
            }, darkMode)
            fetchTickets()
          } else {
            showAlert({
              icon: 'error',
              title: texts.failed,
              text: texts.unableToDelete
            }, darkMode)
          }
        })
      }
    })
  }

  const handleCancel = () => {
    setFormData({
      ticket_id: '',
      customer_id: '',
      issue_type: '',
      status: '',
      priority: '',
      assigned_to: '',
    })
    setIsEditing(false)
  }

  const getUserName = (id) => users.find((u) => u.user_id === id)?.name || '-'
  const getCustomerName = (id) => customers.find((c) => c.customer_id === id)?.name || '-'

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'urgent': return <Zap className="w-4 h-4" />
      case 'high': return <AlertTriangle className="w-4 h-4" />
      case 'medium': return <TrendingUp className="w-4 h-4" />
      case 'low': return <Flag className="w-4 h-4" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent':
        return darkMode ? 'bg-red-600/20 text-red-400 border-red-600/30' : 'bg-red-100 text-red-700 border-red-200'
      case 'high':
        return darkMode ? 'bg-orange-600/20 text-orange-400 border-orange-600/30' : 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium':
        return darkMode ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low':
        return darkMode ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-green-100 text-green-700 border-green-200'
      default:
        return darkMode ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'open': return <Circle className="w-4 h-4" />
      case 'in progress': return <Loader className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      case 'closed': return <ArrowRight className="w-4 h-4" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'open':
        return darkMode ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : 'bg-blue-100 text-blue-700 border-blue-200'
      case 'in progress':
        return darkMode ? 'bg-purple-600/20 text-purple-400 border-purple-600/30' : 'bg-purple-100 text-purple-700 border-purple-200'
      case 'resolved':
        return darkMode ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-green-100 text-green-700 border-green-200'
      case 'closed':
        return darkMode ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return darkMode ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const priorityOptions = [
    { value: 'low', label: texts.low, icon: <Flag className="w-4 h-4" /> },
    { value: 'medium', label: texts.medium, icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'high', label: texts.high, icon: <AlertTriangle className="w-4 h-4" /> },
    { value: 'urgent', label: texts.urgent, icon: <Zap className="w-4 h-4" /> }
  ]

  const statusOptions = [
    { value: 'open', label: texts.open, icon: <Circle className="w-4 h-4" /> },
    { value: 'in progress', label: texts.inProgress, icon: <Loader className="w-4 h-4" /> },
    { value: 'resolved', label: texts.resolved, icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'closed', label: texts.closed, icon: <ArrowRight className="w-4 h-4" /> }
  ]

    const filteredCustomersDropdown = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredUsersDropdown = users.filter((u) =>
    u.name.toLowerCase().includes(assignedSearch.toLowerCase())
  );

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
              {texts.editTicket}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {texts.addNewTicket}
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
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500"
                    : "bg-slate-50 border-gray-200 text-slate-900 focus:border-blue-600"
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

                      <Search
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${
                          darkMode ? 'text-slate-400' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </div>


                  {/* Options List */}
                  <div className="max-h-60 overflow-y-auto" style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}>
                    <style jsx>{`
                      div::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    {filteredCustomersDropdown.length > 0 ? (
                      filteredCustomersDropdown.map((c) => (
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
                      ))
                    ) : (
                      <div className={`px-4 py-2 text-center ${
                        darkMode ? 'text-slate-400' : 'text-slate-400'
                      }`}>
                        {texts.noResults || 'Tidak ada hasil'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Issue Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.issueType}
              </label>
              <div className="relative">
                <FileText className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  darkMode ? "text-slate-500" : "text-slate-500"
                }`} />
                <input
                  type="text"
                  name="issue_type"
                  placeholder={texts.issueTypePlaceholder}
                  value={formData.issue_type}
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

            {/* Priority */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.priority}
              </label>

              <button
                type="button"
                onClick={() => setPriorityOpen(!priorityOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span className={`flex items-center gap-2 ${
                  formData.priority ? "opacity-90" : "opacity-60"
                }`}>
                  {formData.priority ? (
                    <>
                      {priorityOptions.find(p => p.value === formData.priority)?.icon}
                      {priorityOptions.find(p => p.value === formData.priority)?.label}
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      {texts.selectPriority}
                    </>
                  )}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {priorityOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, priority: option.value })
                        setPriorityOpen(false)
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

            {/* Status */}
            <div className="relative">
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
                      <Activity className="w-4 h-4" />
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

            {/* Assigned To */}
            {/* Assigned To */}
<div className="md:col-span-2 relative dropdown-container">
  <label className={`block text-sm font-medium mb-2 ${
    darkMode ? 'text-slate-300' : 'text-slate-700'
  }`}>
    {texts.assignTo}
  </label>

  <button
    type="button"
    onClick={() => setAssignedOpen(!assignedOpen)}
    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
      darkMode
        ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500"
        : "bg-slate-50 border-gray-200 text-slate-900 focus:border-blue-600"
    }`}
  >
    <span className={`flex items-center gap-2 ${
      formData.assigned_to ? "" : "opacity-60"
    }`}>
      <User size={16} className="opacity-60" />
      {formData.assigned_to
        ? users.find((u) => u.user_id === formData.assigned_to)?.name
        : texts.selectUser}
    </span>
    <ChevronDown size={18} className={`opacity-60 transition-transform ${assignedOpen ? 'rotate-180' : ''}`} />
  </button>

  {assignedOpen && (
    <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
      darkMode
        ? "bg-slate-700 border-slate-600"
        : "bg-white border-gray-200"
    }`}>
      {/* Search Input */}
      <div
        className="p-2 border-b-2"
        style={{ borderColor: darkMode ? '#475569' : '#E2E8F0' }}
      >
        <div className="relative">
          <input
            type="text"
            value={assignedSearch}
            onChange={(e) => setAssignedSearch(e.target.value)}
            placeholder={texts.searchPIC}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 transition-colors outline-none ${
              darkMode
                ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400 focus:border-blue-500'
                : 'bg-gray-50 border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
            }`}
            onClick={(e) => e.stopPropagation()}
          />

          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${
              darkMode ? 'text-slate-400' : 'text-slate-400'
            }`}
          />
        </div>
      </div>


      {/* Options List */}
      <div className="max-h-60 overflow-y-auto" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <button
          type="button"
          onClick={() => {
            setFormData({ ...formData, assigned_to: '' })
            setAssignedOpen(false)
            setAssignedSearch('')
          }}
          className={`w-full px-4 py-2 text-left hover:bg-opacity-50 transition-colors ${
            darkMode ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-gray-100 text-slate-400'
          }`}
        >
          {texts.selectUser || 'Pilih User'}
        </button>
        {filteredUsersDropdown.length > 0 ? (
          filteredUsersDropdown.map((u) => (
            <button
              key={u.user_id}
              type="button"
              onClick={() => {
                setFormData({ ...formData, assigned_to: u.user_id })
                setAssignedOpen(false)
                setAssignedSearch('')
              }}
              className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                formData.assigned_to === u.user_id
                  ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                  : (darkMode ? "hover:bg-slate-600 text-white" : "hover:bg-slate-100 text-slate-900")
              }`}
            >
              <User size={16} className="opacity-70" />
              {u.name}
            </button>
          ))
        ) : (
          <div className={`px-4 py-2 text-center ${
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
                  {texts.updateTicket}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {texts.addTicket}
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

      {/* TICKETS LIST */}
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
              {texts.ticketsList} ({filteredTickets.length})
            </h2>

            {/* Search Bar */}
            <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={texts.searchTickets}
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
          <SectionLoader darkMode={darkMode} text={texts.loadingTickets} />
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {searchQuery ? (texts.noResults || 'Tidak ada hasil yang ditemukan') : texts.noTicketsYet}
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {searchQuery ? (texts.tryDifferentKeyword || 'Coba kata kunci lain') : texts.createFirst}
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
                    {texts.customerHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.issue}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.priorityHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.statusHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.assignedTo}
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
                {filteredTickets.map((t) => (
                  <tr key={t.ticket_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {getCustomerName(t.customer_id)}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        <span className="font-medium truncate max-w-[200px]">{t.issue_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${
                        getPriorityColor(t.priority)
                      }`}>
                        {getPriorityIcon(t.priority)}
                        <span className="capitalize">{t.priority}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${
                        getStatusColor(t.status)
                      }`}>
                        {getStatusIcon(t.status)}
                        <span className="capitalize">{t.status}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {getUserName(t.assigned_to)}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(t.created_at).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Asia/Jakarta',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(t)}
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
                          onClick={() => handleDelete(t.ticket_id)}
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