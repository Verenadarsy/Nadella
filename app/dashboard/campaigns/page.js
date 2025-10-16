'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    campaign_id: '',
    campaign_name: '',
    channel: 'email',
    start_date: '',
    end_date: '',
    budget: ''
  })

  useEffect(() => { fetchCampaigns() }, [])

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns')
      const data = await res.json()
      setCampaigns(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Fetch campaigns error:', error)
    }
  }

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.campaign_name || !formData.channel) {
      Swal.fire('⚠️ Peringatan!', 'Nama campaign dan channel wajib diisi.', 'warning')
      return
    }

    const payload = {
      campaign_name: formData.campaign_name,
      channel: formData.channel,
      start_date: formData.start_date,
      end_date: formData.end_date,
      budget: Number(formData.budget),
    }

    const method = isEditing ? 'PUT' : 'POST'
    if (isEditing) payload.campaign_id = formData.campaign_id

    try {
      const res = await fetch('/api/campaigns', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        Swal.fire(
          '✅ Sukses!',
          `Campaign berhasil ${isEditing ? 'diedit' : 'ditambahkan'}!`,
          'success'
        )
        setFormData({ campaign_id: '', campaign_name: '', channel: 'email', start_date: '', end_date: '', budget: '' })
        setIsEditing(false)
        fetchCampaigns()
      } else {
        const err = await res.json()
        Swal.fire('❌ Gagal!', err?.error ?? 'Tidak bisa menyimpan campaign.', 'error')
      }
    } catch (error) {
      Swal.fire('💥 Error!', 'Terjadi kesalahan koneksi.', 'error')
      console.error(error)
    }
  }

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus campaign ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    })

    if (confirm.isConfirmed) {
      const res = await fetch('/api/campaigns', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        Swal.fire('🗑️ Dihapus!', 'Campaign berhasil dihapus.', 'success')
        fetchCampaigns()
      } else Swal.fire('❌ Gagal!', 'Tidak bisa menghapus.', 'error')
    }
  }

  const handleEdit = (campaign) => {
    setFormData(campaign)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        📢 {isEditing ? 'Edit Campaign' : 'Manage Campaigns'}
      </h1>

      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="mb-1 text-sm text-gray-600">Nama Campaign</label>
          <input
            type="text"
            name="campaign_name"
            placeholder="Contoh: Promo Akhir Tahun"
            value={formData.campaign_name}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm text-gray-600">Channel</label>
          <select
            name="channel"
            value={formData.channel}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          >
            <option value="email">Email</option>
            <option value="ads">Ads</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm text-gray-600">Tanggal Mulai</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm text-gray-600">Tanggal Selesai</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm text-gray-600">Budget (Rp)</label>
          <input
            type="number"
            name="budget"
            placeholder="Contoh: 10000000"
            value={formData.budget}
            onChange={handleChange}
            className="border p-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className={`col-span-2 py-2 rounded text-white mt-4 ${
            isEditing ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isEditing ? 'Simpan Perubahan' : 'Tambah Campaign'}
        </button>
      </form>

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Nama Campaign</th>
            <th className="p-2 border">Channel</th>
            <th className="p-2 border">Periode</th>
            <th className="p-2 border">Budget</th>
            <th className="p-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.campaign_id} className="border-t text-center">
              <td className="p-2 border">{c.campaign_name}</td>
              <td className="p-2 border capitalize">{c.channel}</td>
              <td className="p-2 border">
                {new Date(c.start_date).toLocaleDateString('id-ID')} → {new Date(c.end_date).toLocaleDateString('id-ID')}
              </td>
              <td className="p-2 border">Rp {Number(c.budget).toLocaleString('id-ID')}</td>
              <td className="p-2 border flex gap-2 justify-center">
                <button
                  onClick={() => handleEdit(c)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.campaign_id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
          {campaigns.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center text-gray-500 p-4">
                Belum ada campaign
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
