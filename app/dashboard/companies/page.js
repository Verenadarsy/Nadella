'use client'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [form, setForm] = useState({
    company_id: '',
    company_name: '',
    industry: '',
    website: '',
    address: ''
  })
  const [isEditing, setIsEditing] = useState(false)

  // 🧠 Fetch all companies
  const fetchCompanies = async () => {
    const res = await fetch('/api/companies')
    const data = await res.json()
    setCompanies(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  // 📝 Input handler
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // ➕ Create or ✏️ Update
  const handleSubmit = async (e) => {
    e.preventDefault()

    const url = '/api/companies'
    const method = isEditing ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    if (res.ok) {
      Swal.fire(
        'Success',
        isEditing ? 'Company updated successfully' : 'Company added successfully',
        'success'
      )
      setForm({ company_id: '', company_name: '', industry: '', website: '', address: '' })
      setIsEditing(false)
      fetchCompanies()
    } else {
      const err = await res.json()
      Swal.fire('Error', err.message || 'Failed to save company', 'error')
    }
  }

  // 🗑️ Delete company
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'This company will be deleted permanently!',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    })

    if (!confirm.isConfirmed) return

    const res = await fetch('/api/companies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if (res.ok) {
      Swal.fire('Deleted!', 'Company has been removed.', 'success')
      fetchCompanies()
    } else {
      const err = await res.json()
      Swal.fire('Error', err.message || 'Failed to delete company', 'error')
    }
  }

  // ✏️ Load data for editing
  const handleEdit = (company) => {
    setForm(company)
    setIsEditing(true)
  }

  // ❌ Cancel edit mode
  const handleCancel = () => {
    setForm({ company_id: '', company_name: '', industry: '', website: '', address: '' })
    setIsEditing(false)
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Manage Companies</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        {isEditing && (
          <input
            name="company_id"
            value={form.company_id}
            disabled
            style={{ backgroundColor: '#f2f2f2' }}
          />
        )}
        <input
          name="company_name"
          placeholder="Company Name"
          value={form.company_name}
          onChange={handleChange}
          required
        />
        <input
          name="industry"
          placeholder="Industry"
          value={form.industry}
          onChange={handleChange}
        />
        <input
          name="website"
          placeholder="Website"
          value={form.website}
          onChange={handleChange}
        />
        <input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
        />

        <button type="submit">
          {isEditing ? 'Update Company' : 'Add Company'}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={handleCancel}
            style={{ marginLeft: '10px', backgroundColor: '#ccc' }}
          >
            Cancel
          </button>
        )}
      </form>

      <table border="1" style={{ margin: '0 auto', borderCollapse: 'collapse', width: '90%' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f1f1' }}>
            <th>ID</th>
            <th>Name</th>
            <th>Industry</th>
            <th>Website</th>
            <th>Address</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.length > 0 ? (
            companies.map((c) => (
              <tr key={c.company_id}>
                <td>{c.company_id}</td>
                <td>{c.company_name}</td>
                <td>{c.industry}</td>
                <td>{c.website}</td>
                <td>{c.address}</td>
                <td>{new Date(c.created_at).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => handleEdit(c)}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      marginRight: '5px',
                      borderRadius: '5px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.company_id)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '5px'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No companies found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
