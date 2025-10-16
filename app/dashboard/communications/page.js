"use client";
import { useEffect, useState } from "react";

export default function CommunicationsPage() {
  const [communications, setCommunications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customer_id: "",
    type: "email",
    content: "",
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch communications & customers
  useEffect(() => {
    fetchData();
    fetchCustomers();
  }, []);

  async function fetchData() {
    const res = await fetch("/api/communications");
    const data = await res.json();
    setCommunications(data);
  }

  async function fetchCustomers() {
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(data);
  }

  // Realtime timestamp Waktu Indonesia Barat (WIB)
  function getCurrentTimestamp() {
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return wib.toISOString().slice(0, 19).replace("T", " ");
  }

  // Tambah atau Update data
  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form };

    if (!editingId) {
      payload.timestamp = getCurrentTimestamp();
      await fetch("/api/communications", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } else {
      payload.communication_id = editingId;
      await fetch("/api/communications", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setEditingId(null);
    }

    setForm({ customer_id: "", type: "email", content: "" });
    fetchData();
  }

  async function handleDelete(id) {
    if (!confirm("Hapus data ini?")) return;
    await fetch("/api/communications", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchData();
  }

  async function handleEdit(item) {
    setEditingId(item.communication_id);
    setForm({
      customer_id: item.customer_id,
      type: item.type,
      content: item.content,
    });
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">📡 Communications</h1>

      {/* Form Input */}
      <form onSubmit={handleSubmit} className="mb-6 grid gap-3 max-w-lg">
        <select
          className="p-2 border rounded"
          value={form.customer_id}
          onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
          required
        >
          <option value="">Pilih Customer</option>
          {customers.map((c) => (
            <option key={c.customer_id} value={c.customer_id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          required
        >
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="chat">Chat</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        <textarea
          className="p-2 border rounded"
          placeholder="Isi komunikasi..."
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        ></textarea>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editingId ? "💾 Update Communication" : "➕ Add Communication"}
        </button>
      </form>

      {/* Tabel Data */}
      <table className="min-w-full border border-gray-300 rounded-md">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="border px-3 py-2">Customer</th>
            <th className="border px-3 py-2">Type</th>
            <th className="border px-3 py-2">Content</th>
            <th className="border px-3 py-2">Timestamp (WIB)</th>
            <th className="border px-3 py-2 w-40">Actions</th>
          </tr>
        </thead>
        <tbody>
          {communications.map((item) => (
            <tr key={item.communication_id} className="text-center">
              <td className="border px-3 py-2">
                {customers.find((c) => c.customer_id === item.customer_id)
                  ?.name || "-"}
              </td>
              <td className="border px-3 py-2 capitalize">{item.type}</td>
              <td className="border px-3 py-2">{item.content}</td>
              <td className="border px-3 py-2">
                {new Date(item.timestamp).toLocaleString("id-ID", {
                  timeZone: "Asia/Jakarta",
                })}
              </td>
              <td className="border px-3 py-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-blue-600 hover:underline mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.communication_id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {communications.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center py-3 text-gray-500">
                Belum ada data komunikasi.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
