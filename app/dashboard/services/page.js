'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import {
  Wrench, Edit2, Trash2, X, Save, Plus,
  User, Calendar, CheckCircle, XCircle, Clock
} from 'lucide-react'
import FloatingChat from "../floatingchat"

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

  useEffect(() => {
    // Detect dark mode from parent layout
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.customer_id || !formData.service_type) {
      Swal.fire({
        icon: 'warning',
        title: 'Oops',
        text: 'Lengkapi semua field dulu ya!'
      })
      return
    }

    const method = isEditing ? 'PUT' : 'POST'
    const servicePayload = isEditing
      ? formData
      : { ...formData, start_date: getCurrentWIB() }

    try {
      const res = await fetch('/api/services', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(servicePayload),
      })

      if (!res.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: 'Tidak dapat menyimpan service.'
        })
        return
      }

      const saved = await res.json()

      // Tambahkan data detail saat tambah baru
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
        title: 'Sukses!',
        text: `Service berhasil ${isEditing ? 'diedit' : 'ditambahkan'}!`,
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
        text: 'Terjadi kesalahan koneksi.'
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
      title: 'Hapus service ini?',
      text: 'Tindakan ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
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
          title: 'Dihapus!',
          text: 'Service berhasil dihapus.',
          showConfirmButton: false,
          timer: 1500
        })
        fetchServices()
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: 'Tidak bisa menghapus service.'
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
      default: return null
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
              Edit Service
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add New Service
            </>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer Select */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Customer
              </label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 focus:border-blue-600'
                } outline-none`}
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Type Select */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Service Type
              </label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 focus:border-blue-600'
                } outline-none`}
              >
                <option value="">-- Select Type --</option>
                <option value="sip_trunk">📞 SIP Trunk</option>
                <option value="cctv">📹 CCTV</option>
                <option value="gcp_aws">☁️ Cloud (GCP / AWS)</option>
              </select>
            </div>

            {/* Status Select */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 focus:border-blue-600'
                } outline-none`}
              >
                <option value="active">✅ Active</option>
                <option value="inactive">⏸️ Inactive</option>
                <option value="terminated">❌ Terminated</option>
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
        </form>
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
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
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
                        {new Date(service.start_date).toLocaleString('id-ID', {
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