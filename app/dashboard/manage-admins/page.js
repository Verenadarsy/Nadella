'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password_hash: '',
    role: 'admin'
  })
  const [editId, setEditId] = useState(null)

  // ambil semua user lalu filter yang role = admin
  const fetchAdmins = async () => {
    setLoading(true)
    const res = await fetch('/api/users')
    const data = await res.json()
    const adminList = data.filter((user) => user.role === 'admin')
    setAdmins(adminList)
    setLoading(false)
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  // handle input form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // tambah / edit admin
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name || !form.email) {
      Swal.fire('Oops!', 'Nama dan email wajib diisi!', 'warning')
      return
    }

    const method = editId ? 'PUT' : 'POST'
    const body = editId
      ? { ...form, user_id: editId }
      : form

    const res = await fetch('/api/users', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: editId ? 'Admin diperbarui!' : 'Admin ditambahkan!',
        timer: 1500,
        showConfirmButton: false
      })
      setForm({ name: '', email: '', password_hash: '', role: 'admin' })
      setEditId(null)
      fetchAdmins()
    } else {
      Swal.fire('Gagal!', 'Terjadi kesalahan saat menyimpan data.', 'error')
    }
  }

  // klik tombol edit
  const handleEdit = (admin) => {
    setEditId(admin.user_id)
    setForm({
      name: admin.name,
      email: admin.email,
      password_hash: '', // dikosongin biar opsional
      role: 'admin'
    })
  }

  // hapus admin
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Yakin?',
      text: 'Admin ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal'
    })
    if (!confirm.isConfirmed) return

    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if (res.ok) {
      Swal.fire('Dihapus!', 'Admin berhasil dihapus.', 'success')
      fetchAdmins()
    } else {
      Swal.fire('Gagal!', 'Tidak dapat menghapus admin.', 'error')
    }
  }

  // batal edit
  const cancelEdit = () => {
    setEditId(null)
    setForm({ name: '', email: '', password_hash: '', role: 'admin' })
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Kelola Admin</h1>

      {/* Form tambah / edit admin */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          name="name"
          placeholder="Nama"
          value={form.name}
          onChange={handleChange}
          style={{ marginRight: '1rem' }}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={{ marginRight: '1rem' }}
        />
        <input
          type="password"
          name="password_hash"
          placeholder="Password (opsional saat edit)"
          value={form.password_hash}
          onChange={handleChange}
          style={{ marginRight: '1rem' }}
        />
        <button type="submit">
          {editId ? 'Update Admin' : 'Tambah Admin'}
        </button>
        {editId && (
          <button type="button" onClick={cancelEdit} style={{ marginLeft: '1rem' }}>
            Batal
          </button>
        )}
      </form>

      {/* Daftar admin */}
      {loading ? (
        <p>Memuat data admin...</p>
      ) : admins.length === 0 ? (
        <p>Belum ada admin terdaftar.</p>
      ) : (
        <table border="1" cellPadding="8" width="100%" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.user_id}>
                <td>{a.name}</td>
                <td>{a.email}</td>
                <td>{new Date(a.created_at).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => handleEdit(a)}
                    style={{
                      marginRight: '0.5rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a.user_id)}
                    style={{
                      backgroundColor: 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
