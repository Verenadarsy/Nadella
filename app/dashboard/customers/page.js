"use client";

import { useEffect, useState } from "react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editing, setEditing] = useState(null);

  // Ambil semua data customer
  const fetchData = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (res.ok) {
        setCustomers(data);
      } else {
        console.error("❌ Failed to fetch customers:", data.error);
      }
    } catch (err) {
      console.error("💥 Error fetching customers:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Input handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Simpan (POST atau PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editing ? "PUT" : "POST";
      const payload = editing
        ? { ...formData, customer_id: editing.customer_id }
        : formData;

      const res = await fetch("/api/customers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("✅ Customer saved:", data);
        setFormData({ name: "", email: "", phone: "", address: "" });
        setEditing(null);
        fetchData();
      } else {
        console.error("❌ Failed to save customer:", data);
        alert("Gagal menyimpan data customer! Cek console untuk detail error.");
      }
    } catch (err) {
      console.error("💥 handleSubmit error:", err);
    }
  };

  const handleEdit = (cust) => {
    setFormData({
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      address: cust.address,
    });
    setEditing(cust);
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin hapus data ini?")) return;
    try {
      const res = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log("🗑️ Deleted:", data);
        fetchData();
      } else {
        console.error("❌ Delete failed:", data);
      }
    } catch (err) {
      console.error("💥 handleDelete error:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">🧾 Customers CRUD</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 p-4 rounded-lg shadow-md mb-6 space-y-2"
      >
        <input
          type="text"
          name="name"
          placeholder="Customer Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editing ? "Update Customer" : "Add Customer"}
        </button>
      </form>

      <table className="w-full border-collapse border text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Address</th>
            <th className="border p-2">Created At</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((cust) => (
            <tr key={cust.customer_id}>
              <td className="border p-2">{cust.customer_id}</td>
              <td className="border p-2">{cust.name}</td>
              <td className="border p-2">{cust.email}</td>
              <td className="border p-2">{cust.phone}</td>
              <td className="border p-2">{cust.address}</td>
              <td className="border p-2">{cust.created_at}</td>
              <td className="border p-2 space-x-2">
                <button
                  onClick={() => handleEdit(cust)}
                  className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(cust.customer_id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
