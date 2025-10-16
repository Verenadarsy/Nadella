'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

export default function DealsPage() {
  const [deals, setDeals] = useState([])
  const [customers, setCustomers] = useState([])
  const [companies, setCompanies] = useState([])
  const [formData, setFormData] = useState({
    deal_name: '',
    deal_stage: '',
    deal_value: '',
    expected_close_date: '',
    customer_id: '',
    company_id: '',
  })

  // Ambil semua data
  useEffect(() => {
    fetchDeals()
    fetchCustomers()
    fetchCompanies()
  }, [])

  const fetchDeals = async () => {
    const res = await fetch('/api/deals')
    const data = await res.json()
    setDeals(Array.isArray(data) ? data : [])
  }

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers')
    const data = await res.json()
    setCustomers(Array.isArray(data) ? data : [])
  }

  const fetchCompanies = async () => {
    const res = await fetch('/api/companies')
    const data = await res.json()
    setCompanies(Array.isArray(data) ? data : [])
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      Swal.fire('✅ Sukses!', 'Deal berhasil ditambahkan!', 'success')
      setFormData({
        deal_name: '',
        deal_stage: '',
        deal_value: '',
        expected_close_date: '',
        customer_id: '',
        company_id: '',
      })
      fetchDeals()
    } else {
      Swal.fire('❌ Gagal!', 'Tidak dapat menambah deal.', 'error')
    }
  }

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus deal ini?',
      text: 'Tindakan ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    })

    if (confirm.isConfirmed) {
      const res = await fetch('/api/deals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        Swal.fire('🗑️ Dihapus!', 'Deal berhasil dihapus.', 'success')
        fetchDeals()
      } else {
        Swal.fire('❌ Gagal!', 'Tidak bisa menghapus deal.', 'error')
      }
    }
  }

  // 🧩 Temukan nama customer/company dari ID
  const getCustomerName = (id) => customers.find(c => c.customer_id === id)?.name || '-'
  const getCompanyName = (id) => companies.find(c => c.company_id === id)?.company_name || '-'

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">💼 Manage Deals</h1>

      {/* FORM TAMBAH DEAL */}
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-4">
        <input
          type="text"
          name="deal_name"
          placeholder="Deal Name"
          value={formData.deal_name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />

        <select
          name="deal_stage"
          value={formData.deal_stage}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        >
          <option value="">-- Pilih Stage --</option>
          <option value="prospect">Prospect</option>
          <option value="negotiation">Negotiation</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>

        <input
          type="number"
          name="deal_value"
          placeholder="Deal Value"
          value={formData.deal_value}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          type="date"
          name="expected_close_date"
          value={formData.expected_close_date}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <select
          name="customer_id"
          value={formData.customer_id}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="">-- Pilih Customer --</option>
          {customers.map((c) => (
            <option key={c.customer_id} value={c.customer_id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          name="company_id"
          value={formData.company_id}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="">-- Pilih Company --</option>
          {companies.map((c) => (
            <option key={c.company_id} value={c.company_id}>
              {c.company_name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Tambah Deal
        </button>
      </form>

      {/* TABEL DEALS */}
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Nama Deal</th>
            <th className="p-2 border">Stage</th>
            <th className="p-2 border">Value</th>
            <th className="p-2 border">Customer</th>
            <th className="p-2 border">Company</th>
            <th className="p-2 border">Tanggal</th>
            <th className="p-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.deal_id} className="border-t">
              <td className="p-2 border">{deal.deal_name}</td>
              <td className="p-2 border">{deal.deal_stage}</td>
              <td className="p-2 border">{deal.deal_value}</td>
              <td className="p-2 border">{getCustomerName(deal.customer_id)}</td>
              <td className="p-2 border">{getCompanyName(deal.company_id)}</td>
              <td className="p-2 border">{deal.expected_close_date || '-'}</td>
              <td className="p-2 border text-center">
                <button
                  onClick={() => handleDelete(deal.deal_id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}

          {deals.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center text-gray-500 p-4">
                Belum ada deals
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
