"use client"
import { useEffect, useState } from "react"

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({
    customer_id: "",
    source: "",
    lead_status: "new"
  })
  const [editingId, setEditingId] = useState(null)

  // Load leads & customers
  useEffect(() => {
    fetchLeads()
    fetchCustomers()
  }, [])

  async function fetchLeads() {
    try {
      const res = await fetch("/api/leads")
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to fetch leads:", err)
    }
  }

  async function fetchCustomers() {
    try {
      const res = await fetch("/api/customers")
      const data = await res.json()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to fetch customers:", err)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.customer_id || !form.source || !form.lead_status) {
      alert("Please fill all fields")
      return
    }

    try {
      const method = editingId ? "PUT" : "POST"
      const body = editingId ? { ...form, lead_id: editingId } : form

      const res = await fetch("/api/leads", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Failed to save lead: ${errText}`)
      }

      setForm({ customer_id: "", source: "", lead_status: "new" })
      setEditingId(null)
      fetchLeads()
    } catch (err) {
      console.error(err)
      alert("Failed to save lead")
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this lead?")) return
    try {
      const res = await fetch("/api/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      if (!res.ok) throw new Error("Failed to delete lead")
      fetchLeads()
    } catch (err) {
      console.error(err)
    }
  }

  function handleEdit(lead) {
    setForm({
      customer_id: lead.customer_id || "",
      source: lead.source || "",
      lead_status: lead.lead_status || "new"
    })
    setEditingId(lead.lead_id)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Leads Management</h1>

      <form onSubmit={handleSubmit} className="mb-6 bg-gray-100 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={form.customer_id}
            onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            className="p-2 border rounded"
            required
          >
            <option value="">Select Customer</option>
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                {c.name || "Unnamed Customer"}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Source (e.g., Website, Referral)"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            className="p-2 border rounded"
            required
          />

          <select
            value={form.lead_status}
            onChange={(e) => setForm({ ...form, lead_status: e.target.value })}
            className="p-2 border rounded"
            required
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="disqualified">Disqualified</option>
          </select>
        </div>

        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {editingId ? "Update Lead" : "Add Lead"}
        </button>
      </form>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border">Customer</th>
            <th className="p-2 border">Source</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Created At</th>
            <th className="p-2 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.length > 0 ? (
            leads.map((lead) => (
              <tr key={lead.lead_id}>
                <td className="p-2 border">
                  {customers.find((c) => c.customer_id === lead.customer_id)?.name || "Unknown"}
                </td>
                <td className="p-2 border">{lead.source}</td>
                <td className="p-2 border">{lead.lead_status}</td>
                <td className="p-2 border">{new Date(lead.created_at).toLocaleString()}</td>
                <td className="p-2 border text-center">
                  <button
                    onClick={() => handleEdit(lead)}
                    className="px-2 py-1 bg-yellow-400 rounded hover:bg-yellow-500 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(lead.lead_id)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center p-4">
                No leads found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
