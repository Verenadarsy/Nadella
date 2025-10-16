'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

// ✅ Dapetin waktu real-time dalam format "YYYY-MM-DD HH:mm:ss" WIB
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
  const [tickets, setTickets] = useState([])
  const [users, setUsers] = useState([])
  const [customers, setCustomers] = useState([])
  const [formData, setFormData] = useState({
    ticket_id: '',
    customer_id: '',
    issue_type: '',
    status: 'open',
    priority: 'medium',
    assigned_to: '',
  })
  const [isEditing, setIsEditing] = useState(false)

  // 🔹 ambil semua data saat load
  useEffect(() => {
    fetchTickets()
    fetchUsers()
    fetchCustomers()
  }, [])

  const fetchTickets = async () => {
    const res = await fetch('/api/tickets')
    const data = await res.json()
    setTickets(Array.isArray(data) ? data : [])
  }

  const fetchUsers = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
  }

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(Array.isArray(data) ? data : [])
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // ✅ Tambah atau update ticket
  const handleSubmit = async (e) => {
    e.preventDefault()

    const method = isEditing ? 'PUT' : 'POST'
    const url = '/api/tickets'
    const payload = isEditing
      ? formData
      : { ...formData, created_at: getCurrentWIB() }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      Swal.fire(
        '✅ Sukses!',
        `Ticket berhasil ${isEditing ? 'diedit' : 'ditambahkan'}!`,
        'success'
      )
      setFormData({
        ticket_id: '',
        customer_id: '',
        issue_type: '',
        status: 'open',
        priority: 'medium',
        assigned_to: '',
      })
      setIsEditing(false)
      fetchTickets()
    } else {
      Swal.fire('❌ Gagal!', 'Operasi tidak berhasil.', 'error')
    }
  }

  // ✏️ edit ticket
  const handleEdit = (ticket) => {
    setFormData(ticket)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ❌ hapus ticket
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus ticket ini?',
      text: 'Tindakan ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    })

    if (confirm.isConfirmed) {
      const res = await fetch('/api/tickets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        Swal.fire('🗑️ Dihapus!', 'Ticket berhasil dihapus.', 'success')
        fetchTickets()
      } else {
        Swal.fire('❌ Gagal!', 'Tidak bisa menghapus ticket.', 'error')
      }
    }
  }

  const getUserName = (id) => users.find((u) => u.user_id === id)?.name || '-'
  const getCustomerName = (id) => customers.find((c) => c.customer_id === id)?.name || '-'

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        🎫 {isEditing ? 'Edit Ticket' : 'Manage Tickets'}
      </h1>

      {/* FORM TAMBAH / EDIT TICKET */}
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

        <input
          type="text"
          name="issue_type"
          placeholder="Jenis Masalah"
          value={formData.issue_type}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          name="assigned_to"
          value={formData.assigned_to}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="">-- Assign ke User --</option>
          {users.map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className={`col-span-2 text-white py-2 rounded ${
            isEditing ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isEditing ? 'Simpan Perubahan' : 'Tambah Ticket'}
        </button>
      </form>

      {/* TABEL TICKETS */}
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Customer</th>
            <th className="p-2 border">Issue</th>
            <th className="p-2 border">Priority</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Assigned To</th>
            <th className="p-2 border">Dibuat (WIB)</th>
            <th className="p-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.ticket_id} className="border-t">
              <td className="p-2 border">{getCustomerName(t.customer_id)}</td>
              <td className="p-2 border">{t.issue_type}</td>
              <td className="p-2 border capitalize">{t.priority}</td>
              <td className="p-2 border capitalize">{t.status}</td>
              <td className="p-2 border">{getUserName(t.assigned_to)}</td>
              <td className="p-2 border">
                {new Date(t.created_at).toLocaleString('id-ID', {
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
                  onClick={() => handleEdit(t)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(t.ticket_id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}

          {tickets.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center text-gray-500 p-4">
                Belum ada ticket
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
