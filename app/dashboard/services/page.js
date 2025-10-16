'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

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
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    service_id: '',
    customer_id: '',
    service_type: '',
    status: 'active',
  })

  useEffect(() => {
    fetchServices()
    fetchCustomers()
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

  // Tambah / Edit service
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.customer_id || !formData.service_type) {
      Swal.fire('⚠️ Oops', 'Lengkapi semua field dulu ya!', 'warning')
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
        Swal.fire('❌ Gagal!', 'Tidak dapat menyimpan service.', 'error')
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

      Swal.fire(
        '✅ Sukses!',
        `Service berhasil ${isEditing ? 'diedit' : 'ditambahkan'}!`,
        'success'
      )

      setFormData({ service_id: '', customer_id: '', service_type: '', status: 'active' })
      setIsEditing(false)
      fetchServices()
    } catch (err) {
      console.error(err)
      Swal.fire('💥 Error', 'Terjadi kesalahan koneksi.', 'error')
    }
  }

  // Edit service
  const handleEdit = (service) => {
    setFormData(service)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Hapus service
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus service ini?',
      text: 'Tindakan ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    })

    if (confirm.isConfirmed) {
      const res = await fetch('/api/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        Swal.fire('🗑️ Dihapus!', 'Service berhasil dihapus.', 'success')
        fetchServices()
      } else {
        Swal.fire('❌ Gagal!', 'Tidak bisa menghapus service.', 'error')
      }
    }
  }

  const getCustomerName = (id) =>
    customers.find((c) => c.customer_id === id)?.name || '-'

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        🧩 {isEditing ? 'Edit Service' : 'Manage Services'}
      </h1>

      {/* Form tambah / edit service */}
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-4">
        <select
          name="customer_id"
          value={formData.customer_id}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="">-- Pilih Customer --</option>
          {customers.map((c) => (
            <option key={c.customer_id} value={c.customer_id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          name="service_type"
          value={formData.service_type}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="">-- Pilih Tipe Service --</option>
          <option value="sip_trunk">SIP Trunk</option>
          <option value="cctv">CCTV</option>
          <option value="gcp_aws">Cloud (GCP / AWS)</option>
        </select>

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>

        <button
          type="submit"
          className={`col-span-2 py-2 rounded text-white ${
            isEditing ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isEditing ? 'Simpan Perubahan' : 'Tambah Service'}
        </button>
      </form>

      {/* Tabel service */}
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Customer</th>
            <th className="p-2 border">Tipe Service</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Mulai (WIB)</th>
            <th className="p-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.service_id} className="border-t">
              <td className="p-2 border">{getCustomerName(s.customer_id)}</td>
              <td className="p-2 border capitalize">{s.service_type.replace('_', ' ')}</td>
              <td className="p-2 border capitalize">{s.status}</td>
              <td className="p-2 border">
                {new Date(s.start_date).toLocaleString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Jakarta',
                })}
              </td>
              <td className="p-2 border flex gap-2 justify-center">
                <button
                  onClick={() => handleEdit(s)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(s.service_id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}

          {services.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center text-gray-500 p-4">
                Belum ada service
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
