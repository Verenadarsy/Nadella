'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import {
  Wrench, Edit2, Trash2, X, Save, Plus,
  User, Calendar, CheckCircle, XCircle, Clock, ChevronDown,
  Phone, Video, Cloud, Activity
} from 'lucide-react'
import FloatingChat from "../floatingchat"

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
  const [services, setServices] = useState([])
  const [customers, setCustomers] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    service_id: '',
    customer_id: '',
    service_type: '',
    status: 'active',
  })
  const [customerOpen, setCustomerOpen] = useState(false)
  const [serviceTypeOpen, setServiceTypeOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchServices()
    fetchCustomers()

    return () => observer.disconnect()
  }, [])

  const fetchServices = async () => {
    const res = await fetch('/api/services')
    const data = await res.json()
    setServices(Array.isArray(data) ? data : [])
  }

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(Array.isArray(data) ? data : [])
  }

  const handleSubmit = async (e) => {
  e.preventDefault()

  if (!formData.customer_id || !formData.service_type || !formData.status) {
    Swal.fire({
      icon: 'warning',
      title: 'Oops',
      text: 'Complete all fields first!'
    })
    return
  }

  const method = isEditing ? 'PUT' : 'POST'
  const servicePayload = isEditing
    ? formData
    : {
        customer_id: formData.customer_id,
        service_type: formData.service_type,
        status: formData.status,
        start_date: getCurrentDateWIB() // ✅ Sekarang udah bener!
      }

  try {
    const res = await fetch('/api/services', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(servicePayload),
    })

    if (!res.ok) {
      Swal.fire({
        icon: 'error',
        title: 'Failed!',
        text: 'Unable to save the service.'
      })
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

    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: `Service successfully ${isEditing ? 'edited' : 'added'}!`,
      showConfirmButton: false,
      timer: 1500
    })

    setFormData({ service_id: '', customer_id: '', service_type: '', status: 'active' })
    setIsEditing(false)
    fetchServices()
  } catch (err) {
    console.error(err)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'A connection error occurred.'
    })
  }
}

  const handleEdit = (service) => {
    setFormData(service)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Delete this service?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    })

    if (confirm.isConfirmed) {
      const res = await fetch('/api/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Service successfully deleted.',
          showConfirmButton: false,
          timer: 1500
        })
        fetchServices()
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed!',
          text: 'Unable to delete the service.'
        })
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
    { value: 'sip_trunk', label: 'SIP Trunk', icon: <Phone className="w-4 h-4" /> },
    { value: 'cctv', label: 'CCTV', icon: <Video className="w-4 h-4" /> },
    { value: 'gcp_aws', label: 'Cloud (GCP/AWS)', icon: <Cloud className="w-4 h-4" /> }
  ]

  const statusOptions = [
    { value: 'active', label: 'Active', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'inactive', label: 'Inactive', icon: <Clock className="w-4 h-4" /> },
    { value: 'terminated', label: 'Terminated', icon: <XCircle className="w-4 h-4" /> }
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
              Edit Service
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add New Service
            </>
          )}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Dropdown */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Customer
              </label>

              <button
                type="button"
                onClick={() => setCustomerOpen(!customerOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span className={`flex items-center gap-2 ${
                  formData.customer_id ? "opacity-90" : "opacity-60"
                }`}>
                  <User size={16} className="opacity-60" />
                  {formData.customer_id
                    ? customers.find((c) => c.customer_id === formData.customer_id)?.name
                    : "Select Customer"}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {customerOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 max-h-60 overflow-y-auto ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  {customers.map((c) => (
                    <button
                      key={c.customer_id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, customer_id: c.customer_id })
                        setCustomerOpen(false)
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

            {/* Service Type Dropdown */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Service Type
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
                      Select Service Type
                    </>
                  )}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {serviceTypeOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
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
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Status
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
                      Select Status
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
                  Update Service
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Service
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
                Cancel
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
          <h2 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Services List ({services.length})
          </h2>
        </div>

        {services.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              No services yet
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              Create your first service above
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
                    Service Type
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Start Date
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {services.map((service) => (
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
                        <span className="capitalize">{service.service_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${
                        getStatusColor(service.status)
                      }`}>
                        {getStatusIcon(service.status)}
                        <span className="capitalize">{service.status}</span>
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