'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    invoice_id: '',
    customer_id: '',
    amount: '',
    due_date: '',
    status: '',
  })

  // 🔹 ambil data awal
  useEffect(() => {
    fetchInvoices()
    fetchCustomers()
  }, [])

  const fetchInvoices = async () => {
    const res = await fetch('/api/invoices')
    const data = await res.json()
    setInvoices(Array.isArray(data) ? data : [])
  }

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(Array.isArray(data) ? data : [])
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // ✅ tambah / update invoice
  const handleSubmit = async (e) => {
    e.preventDefault()

    const method = isEditing ? 'PUT' : 'POST'
    const newInvoice = isEditing
      ? formData
      : {
          ...formData,
          created_at: new Date(
            new Date().getTime() + 7 * 60 * 60 * 1000
          ).toISOString(), // WIB
        }

    const res = await fetch('/api/invoices', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInvoice),
    })

    if (res.ok) {
      Swal.fire(
        '✅ Sukses!',
        `Invoice berhasil ${isEditing ? 'diedit' : 'ditambahkan'}!`,
        'success'
      )
      setFormData({
        invoice_id: '',
        customer_id: '',
        amount: '',
        due_date: '',
        status: '',
      })
      setIsEditing(false)
      fetchInvoices()
    } else {
      Swal.fire('❌ Gagal!', 'Operasi tidak berhasil.', 'error')
    }
  }

  // ✏️ edit invoice
  const handleEdit = (invoice) => {
    setFormData(invoice)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ❌ hapus invoice
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus invoice ini?',
      text: 'Tindakan ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    })

    if (confirm.isConfirmed) {
      const res = await fetch('/api/invoices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        Swal.fire('🗑️ Dihapus!', 'Invoice berhasil dihapus.', 'success')
        fetchInvoices()
      } else {
        Swal.fire('❌ Gagal!', 'Tidak bisa menghapus invoice.', 'error')
      }
    }
  }

  // 🧩 ambil nama customer
  const getCustomerName = (id) =>
    customers.find((c) => c.customer_id === id)?.name || '-'

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        💰 {isEditing ? 'Edit Invoice' : 'Manage Invoices'}
      </h1>

      {/* FORM TAMBAH / EDIT INVOICE */}
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
          type="number"
          name="amount"
          placeholder="Jumlah (Rp)"
          value={formData.amount}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <input
          type="date"
          name="due_date"
          value={formData.due_date}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="">-- Pilih Status --</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>

        <button
          type="submit"
          className={`col-span-2 text-white py-2 rounded ${
            isEditing
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isEditing ? 'Simpan Perubahan' : 'Tambah Invoice'}
        </button>
      </form>

      {/* TABEL INVOICE */}
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Customer</th>
            <th className="p-2 border">Jumlah</th>
            <th className="p-2 border">Jatuh Tempo</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Dibuat</th>
            <th className="p-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.invoice_id} className="border-t">
              <td className="p-2 border">{getCustomerName(i.customer_id)}</td>
              <td className="p-2 border">
                Rp {Number(i.amount).toLocaleString('id-ID')}
              </td>
              <td className="p-2 border">
                {i.due_date
                  ? new Date(i.due_date).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </td>
              <td
                className={`p-2 border capitalize ${
                  i.status === 'paid'
                    ? 'text-green-600'
                    : i.status === 'overdue'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}
              >
                {i.status}
              </td>
              <td className="p-2 border">
                {new Date(i.created_at).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="p-2 border flex gap-2 justify-center">
                <button
                  onClick={() => handleEdit(i)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(i.invoice_id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}

          {invoices.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center text-gray-500 p-4">
                Belum ada invoice
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
