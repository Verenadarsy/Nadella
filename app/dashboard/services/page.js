'use client'
import { useEffect, useState } from 'react'
import { showAlert } from '@/lib/sweetalert';
import {
  Wrench, Edit2, Trash2, X, Save, Plus,
  User, Calendar, CheckCircle, XCircle, Clock, ChevronDown,
  Phone, Video, Cloud, Activity, Search
} from 'lucide-react'
import FloatingChat from "../floatingchat"
import SectionLoader from '../components/sectionloader'
import { useLanguage } from '@/lib/languageContext'

const getCurrentDateWIB = () => {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000
  const wib = new Date(utcMs + 7 * 60 * 60 * 1000)

  const pad = (n) => n.toString().padStart(2, '0')
  const year = wib.getFullYear()
  const month = pad(wib.getMonth() + 1)
  const day = pad(wib.getDate())

  return `${year}-${month}-${day}`
}

export default function ServicesPage() {
  const { language, t } = useLanguage()
  const texts = t.services[language]

  // State declarations
  const [services, setServices] = useState([])
  const [customers, setCustomers] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    service_id: '',
    customer_id: '',
    service_type: '',
    status: 'active',
  })

  // Dropdown states
  const [customerOpen, setCustomerOpen] = useState(false)
  const [serviceTypeOpen, setServiceTypeOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  // Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredServices, setFilteredServices] = useState([])
  const [customerSearch, setCustomerSearch] = useState("")

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchServices()
    fetchCustomers()

    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setCustomerOpen(false)
        setServiceTypeOpen(false)
        setStatusOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      observer.disconnect()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter services berdasarkan search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredServices(services)
    } else {
      const filtered = services.filter((service) => {
        const customerName = getCustomerName(service.customer_id).toLowerCase()
        const serviceType = service.service_type?.toLowerCase() || ""
        const status = service.status?.toLowerCase() || ""

        return (
          customerName.includes(searchQuery.toLowerCase()) ||
          serviceType.includes(searchQuery.toLowerCase()) ||
          status.includes(searchQuery.toLowerCase())
        )
      })
      setFilteredServices(filtered)
    }
  }, [searchQuery, services])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/services')
      const data = await res.json()
      const servicesData = Array.isArray(data) ? data : []
      setServices(servicesData)
      setFilteredServices(servicesData)
    } catch (err) {
      console.error('Error fetching services:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(Array.isArray(data) ? data : [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.customer_id || !formData.service_type || !formData.status) {
      showAlert({
        icon: 'warning',
        title: texts.oops,
        text: texts.completeAllFields
      }, darkMode)
      return
    }

    const method = isEditing ? 'PUT' : 'POST'
    const servicePayload = isEditing
      ? formData
      : {
          customer_id: formData.customer_id,
          service_type: formData.service_type,
          status: formData.status,
          start_date: getCurrentDateWIB()
        }

    try {
      const res = await fetch('/api/services', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(servicePayload),
      })

      if (!res.ok) {
        showAlert({
          icon: 'error',
          title: texts.failed,
          text: texts.unableToSave
        }, darkMode)
        return
      }

      const saved = await res.json()

      if (!isEditing) {
        let detailEndpoint = ''
        let detailBody = {}

        if (formData.service_type === 'cctv') {
          detailEndpoint = '/api/service_cctv'
          detailBody = {
            service_id: saved.service_id,
            user_account: 'user_demo',
            password: '123456',
            serial_no: 'SN123',
            encryption_code: 'ENC001',
            user_mobile_app: 'demoapp',
            pwd_mobile_app: 'demo123',
          }
        } else if (formData.service_type === 'sip_trunk') {
          detailEndpoint = '/api/service_sip_trunk'
          detailBody = {
            service_id: saved.service_id,
            user_id_phone: '1001',
            password: 'abc123',
            sip_server: 'sip.provider.com',
          }
        } else if (formData.service_type === 'gcp_aws') {
          detailEndpoint = '/api/service_cloud'
          detailBody = {
            service_id: saved.service_id,
            user_email: 'user@demo.com',
            password: 'cloudpass',
            provider: 'gcp',
          }
        }

        if (detailEndpoint) {
          await fetch(detailEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(detailBody),
          })
        }
      }

      showAlert({
        icon: 'success',
        title: texts.success,
        text: isEditing ? texts.serviceEdited : texts.serviceAdded,
        showConfirmButton: false,
        timer: 1500
      }, darkMode)

      setFormData({ service_id: '', customer_id: '', service_type: '', status: 'active' })
      setIsEditing(false)
      fetchServices()
    } catch (err) {
      console.error(err)
      showAlert({
        icon: 'error',
        title: texts.error,
        text: texts.connectionError
      }, darkMode)
    }
  }

  const handleEdit = (service) => {
    setFormData(service)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    const confirm = await showAlert({
      title: texts.deleteService,
      text: texts.cannotUndo,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: texts.yesDelete,
      cancelButtonText: texts.cancel,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode)

    if (confirm.isConfirmed) {
      const res = await fetch('/api/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        showAlert({
          icon: 'success',
          title: texts.deleted,
          text: texts.serviceDeleted,
          showConfirmButton: false,
          timer: 1500
        }, darkMode)
        fetchServices()
      } else {
        showAlert({
          icon: 'error',
          title: texts.failed,
          text: texts.unableToDelete
        }, darkMode)
      }
    }
  }

  const getCustomerName = (id) =>
    customers.find((c) => c.customer_id === id)?.name || '-'

  const getStatusColor = (status) => {
    switch(status) {
      case 'active':
        return darkMode ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-green-100 text-green-700 border-green-200'
      case 'inactive':
        return darkMode ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'terminated':
        return darkMode ? 'bg-red-600/20 text-red-400 border-red-600/30' : 'bg-red-100 text-red-700 border-red-200'
      default:
        return darkMode ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'inactive': return <Clock className="w-4 h-4" />
      case 'terminated': return <XCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getServiceTypeIcon = (type) => {
    switch(type) {
      case 'sip_trunk': return <Phone className="w-4 h-4" />
      case 'cctv': return <Video className="w-4 h-4" />
      case 'gcp_aws': return <Cloud className="w-4 h-4" />
      default: return <Wrench className="w-4 h-4" />
    }
  }

  const getServiceTypeColor = (type) => {
    switch(type) {
      case 'sip_trunk':
        return darkMode ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : 'bg-blue-100 text-blue-700 border-blue-200'
      case 'cctv':
        return darkMode ? 'bg-purple-600/20 text-purple-400 border-purple-600/30' : 'bg-purple-100 text-purple-700 border-purple-200'
      case 'gcp_aws':
        return darkMode ? 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30' : 'bg-cyan-100 text-cyan-700 border-cyan-200'
      default:
        return darkMode ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const serviceTypeOptions = [
    { value: 'sip_trunk', label: texts.sipTrunk, icon: <Phone className="w-4 h-4" /> },
    { value: 'cctv', label: texts.cctv, icon: <Video className="w-4 h-4" /> },
    { value: 'gcp_aws', label: texts.cloudGcpAws, icon: <Cloud className="w-4 h-4" /> }
  ]

  const statusOptions = [
    { value: 'active', label: texts.active, icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'inactive', label: texts.inactive, icon: <Clock className="w-4 h-4" /> },
    { value: 'terminated', label: texts.terminated, icon: <XCircle className="w-4 h-4" /> }
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
              {texts.editService}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {texts.addNewService}
            </>
          )}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Dropdown */}
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
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border-2 z-50 ${
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
                      <Search className={`absolute left-3 top-2.5 w-5 h-5 ${
                        darkMode ? 'text-slate-400' : 'text-slate-400'
                      }`} />
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
                    {customers.filter((c) =>
                      c.name.toLowerCase().includes(customerSearch.toLowerCase())
                    ).length > 0 ? (
                      customers.filter((c) =>
                        c.name.toLowerCase().includes(customerSearch.toLowerCase())
                      ).map((c) => (
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

            {/* Service Type Dropdown */}
            <div className="relative dropdown-container">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.serviceType}
              </label>

              <button
                type="button"
                onClick={() => setServiceTypeOpen(!serviceTypeOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span className={`flex items-center gap-2 ${
                  formData.service_type ? "opacity-90" : "opacity-60"
                }`}>
                  {formData.service_type ? (
                    <>
                      {serviceTypeOptions.find(s => s.value === formData.service_type)?.icon}
                      {serviceTypeOptions.find(s => s.value === formData.service_type)?.label}
                    </>
                  ) : (
                    <>
                      <Wrench className="w-4 h-4" />
                      {texts.selectServiceType}
                    </>
                  )}
                </span>
                <ChevronDown size={18} className={`opacity-60 transition-transform ${serviceTypeOpen ? 'rotate-180' : ''}`} />
              </button>

              {serviceTypeOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border-2 z-50 ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  {serviceTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, service_type: option.value })
                        setServiceTypeOpen(false)
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

            {/* Status Dropdown */}
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
                      <Activity className="w-4 h-4" />
                      {texts.selectStatus}
                    </>
                  )}
                </span>
                <ChevronDown size={18} className={`opacity-60 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
              </button>

              {statusOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border-2 z-50 ${
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
                  {texts.updateService}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {texts.addService}
                </>
              )}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setFormData({ service_id: '', customer_id: '', service_type: '', status: 'active' })
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

      {/* SERVICES LIST */}
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
              {texts.servicesList} ({filteredServices.length})
            </h2>

            {/* Search Bar */}
            <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={texts.searchServices}
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
          <SectionLoader darkMode={darkMode} text={texts.loadingServices} />
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {searchQuery ? (texts.noResults || 'Tidak ada hasil yang ditemukan') : texts.noServicesYet}
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
                    {texts.serviceTypeHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.statusHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.startDate}
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.actions}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {filteredServices.map((service) => (
                  <tr key={service.service_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {getCustomerName(service.customer_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${
                        getServiceTypeColor(service.service_type)
                      }`}>
                        {getServiceTypeIcon(service.service_type)}
                        <span className="capitalize">
                          {service.service_type === 'sip_trunk' ? texts.sipTrunk :
                          service.service_type === 'cctv' ? texts.cctv :
                          service.service_type === 'gcp_aws' ? texts.cloudGcpAws : service.service_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${
                        getStatusColor(service.status)
                      }`}>
                        {getStatusIcon(service.status)}
                        <span className="capitalize">{texts[service.status]}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(service.start_date).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(service)}
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
                          onClick={() => handleDelete(service.service_id)}
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