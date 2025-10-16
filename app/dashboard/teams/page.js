'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [users, setUsers] = useState([]) // daftar user untuk dropdown manager
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    team_id: '',
    team_name: '',
    manager_id: ''
  })

  useEffect(() => {
    fetchTeams()
    fetchUsers()
  }, [])

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams')
      const data = await res.json()
      setTeams(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch teams error:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch users error:', err)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Tambah / Edit tim
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.team_name) {
      Swal.fire('⚠️ Peringatan', 'Nama tim wajib diisi', 'warning')
      return
    }

    try {
      const method = isEditing ? 'PUT' : 'POST'
      const body = JSON.stringify(formData)
      const res = await fetch('/api/teams', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      })

      if (res.ok) {
        Swal.fire(
          '✅ Sukses!',
          `Tim berhasil ${isEditing ? 'diedit' : 'ditambahkan'}!`,
          'success'
        )
        setFormData({ team_id: '', team_name: '', manager_id: '' })
        setIsEditing(false)
        fetchTeams()
      } else {
        const err = await res.json()
        Swal.fire('❌ Gagal', err?.error ?? 'Operasi gagal.', 'error')
      }
    } catch (err) {
      console.error(err)
      Swal.fire('💥 Error', 'Terjadi kesalahan koneksi.', 'error')
    }
  }

  // Edit tim
  const handleEdit = (team) => {
    setFormData(team)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Hapus tim
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus tim ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal'
    })

    if (confirm.isConfirmed) {
      try {
        const res = await fetch('/api/teams', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        })

        if (res.ok) {
          Swal.fire('🗑️ Dihapus!', 'Tim berhasil dihapus.', 'success')
          fetchTeams()
        } else {
          Swal.fire('❌ Gagal', 'Tidak bisa menghapus tim.', 'error')
        }
      } catch (err) {
        console.error(err)
        Swal.fire('💥 Error', 'Terjadi kesalahan koneksi.', 'error')
      }
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        👥 {isEditing ? 'Edit Tim' : 'Manage Teams'}
      </h1>

      {/* Form Tambah / Edit */}
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="mb-1 text-sm text-gray-600">Nama Tim</label>
          <input
            type="text"
            name="team_name"
            placeholder="Contoh: Marketing Team"
            value={formData.team_name}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm text-gray-600">Manajer</label>
          <select
            name="manager_id"
            value={formData.manager_id}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">-- Pilih Manajer --</option>
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.name || u.username}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className={`col-span-2 text-white py-2 rounded mt-4 ${
            isEditing ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isEditing ? 'Simpan Perubahan' : 'Tambah Tim'}
        </button>
      </form>

      {/* Tabel daftar tim */}
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Nama Tim</th>
            <th className="p-2 border">Manajer</th>
            <th className="p-2 border">Dibuat</th>
            <th className="p-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => {
            const manager = users.find((u) => u.user_id === t.manager_id)
            return (
              <tr key={t.team_id} className="border-t text-center">
                <td className="p-2 border">{t.team_name}</td>
                <td className="p-2 border">
                  {manager ? manager.name || manager.username : '-'}
                </td>
                <td className="p-2 border">
                  {t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : '-'}
                </td>
                <td className="p-2 border flex gap-2 justify-center">
                  <button
                    onClick={() => handleEdit(t)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.team_id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            )
          })}

          {teams.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center text-gray-500 p-4">
                Belum ada tim
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
