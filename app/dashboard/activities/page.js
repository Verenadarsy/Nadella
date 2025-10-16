'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

// 🔹 Fungsi buat dapetin waktu sekarang dalam format WIB
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

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([])
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    type: '',
    notes: '',
    assigned_to: '',
  })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchActivities()
    fetchUsers()
  }, [])

  const fetchActivities = async () => {
    const res = await fetch('/api/activities')
    const data = await res.json()
    setActivities(Array.isArray(data) ? data : [])
  }

  const fetchUsers = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // ✅ tambah atau update activity
  const handleSubmit = async (e) => {
    e.preventDefault()

    const activityData = {
      ...formData,
      date: getCurrentWIB(),
    }

    const url = '/api/activities'
    const method = editingId ? 'PUT' : 'POST'
    if (editingId) activityData.activity_id = editingId

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData),
    })

    if (res.ok) {
      Swal.fire(
        '✅ Sukses!',
        editingId ? 'Activity berhasil diperbarui!' : 'Activity berhasil ditambahkan!',
        'success'
      )
      setFormData({ type: '', notes: '', assigned_to: '' })
      setEditingId(null)
      fetchActivities()
    } else {
      Swal.fire('❌ Gagal!', 'Terjadi kesalahan saat menyimpan activity.', 'error')
    }
  }

  // 🗑️ hapus activity
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus activity ini?',
      text: 'Tindakan ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    })

    if (confirm.isConfirmed) {
      const res = await fetch('/api/activities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        Swal.fire('🗑️ Dihapus!', 'Activity berhasil dihapus.', 'success')
        fetchActivities()
      } else {
        Swal.fire('❌ Gagal!', 'Tidak bisa menghapus activity.', 'error')
      }
    }
  }

  // ✏️ edit activity
  const handleEdit = (activity) => {
    setEditingId(activity.activity_id)
    setFormData({
      type: activity.type,
      notes: activity.notes,
      assigned_to: activity.assigned_to,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' }) // biar auto scroll ke form
  }

  // 🧩 ambil nama user dari ID
  const getUserName = (id) => users.find((u) => u.user_id === id)?.name || '-'

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">🗓️ Manage Activities</h1>

      {/* FORM TAMBAH / EDIT */}
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-4">
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="">-- Pilih Tipe Activity --</option>
          <option value="call">Call</option>
          <option value="meeting">Meeting</option>
          <option value="email">Email</option>
          <option value="follow-up">Follow-Up</option>
        </select>

        <select
          name="assigned_to"
          value={formData.assigned_to}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="">-- Pilih User --</option>
          {users.map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.name}
            </option>
          ))}
        </select>

        <textarea
          name="notes"
          placeholder="Catatan Activity"
          value={formData.notes}
          onChange={handleChange}
          className="border p-2 rounded col-span-2"
        />

        <button
          type="submit"
          className={`col-span-2 ${
            editingId ? 'bg-green-600' : 'bg-blue-600'
          } text-white py-2 rounded hover:opacity-90`}
        >
          {editingId ? '💾 Update Activity' : '➕ Tambah Activity'}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setFormData({ type: '', notes: '', assigned_to: '' })
            }}
            className="col-span-2 bg-gray-400 text-white py-2 rounded hover:opacity-90"
          >
            Batal Edit
          </button>
        )}
      </form>

      {/* TABEL DATA */}
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Tipe</th>
            <th className="p-2 border">Tanggal (WIB)</th>
            <th className="p-2 border">Assigned To</th>
            <th className="p-2 border">Catatan</th>
            <th className="p-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((a) => (
            <tr key={a.activity_id} className="border-t">
              <td className="p-2 border capitalize">{a.type}</td>
              <td className="p-2 border">
                {new Date(a.date).toLocaleString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Jakarta',
                })}
              </td>
              <td className="p-2 border">{getUserName(a.assigned_to)}</td>
              <td className="p-2 border">{a.notes || '-'}</td>
              <td className="p-2 border text-center space-x-2">
                <button
                  onClick={() => handleEdit(a)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(a.activity_id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}

          {activities.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center text-gray-500 p-4">
                Belum ada activity
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
