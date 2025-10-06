"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"

export default function ProductsCRUD() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ product_name: "", price: "", description: "" })
  const [editId, setEditId] = useState(null)

  // 🔒 Cek role admin sebelum load data
  useEffect(() => {
    const roleCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("userRole="))
      ?.split("=")[1]

    if (!roleCookie) {
      Swal.fire({
        icon: "warning",
        title: "Access Denied",
        text: "Kamu harus login dulu!",
      }).then(() => router.push("/login?auth=required"))
      return
    }

    if (roleCookie !== "admin") {
      Swal.fire({
        icon: "error",
        title: "Akses ditolak!",
        text: "Halaman ini hanya untuk Admin.",
      }).then(() => router.push(`/dashboard/${roleCookie}`))
      return
    }

    fetchProducts()
  }, [])

  // Ambil semua data produk
  const fetchProducts = async () => {
    const res = await fetch("/api/products")
    const data = await res.json()
    setProducts(data)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const method = editId ? "PUT" : "POST"
    const body = editId ? { ...form, product_id: editId } : form

    const res = await fetch("/api/products", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: editId ? "Produk diperbarui!" : "Produk ditambahkan!",
      })
      setForm({ product_name: "", price: "", description: "" })
      setEditId(null)
      fetchProducts()
    }
  }

  const handleEdit = (p) => {
    setEditId(p.product_id)
    setForm({
      product_name: p.product_name,
      price: p.price,
      description: p.description,
    })
  }

  const handleDelete = async (id) => {
    if (!confirm("Hapus produk ini?")) return
    await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    fetchProducts()
  }

  return (
    <div style={{ padding: "2rem" }}>
      {/* 🔹 Header + Tombol kembali */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Products CRUD</h1>
        <button
          onClick={() => router.push("/dashboard/admin")}
          style={{
            backgroundColor: "#555",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ⬅ Kembali ke Dashboard
        </button>
      </div>

      {/* 🔹 Form Tambah / Edit Produk */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          name="product_name"
          placeholder="Product Name"
          value={form.product_name}
          onChange={handleChange}
          required
        />
        <input
          name="price"
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          required
        />
        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
        <button type="submit">{editId ? "Update" : "Add Product"}</button>
      </form>

      {/* 🔹 Tabel Produk */}
      <table border="1" cellPadding="8" width="100%">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Price</th>
            <th>Description</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products?.length ? (
            products.map((p) => (
              <tr key={p.product_id}>
                <td>{p.product_name}</td>
                <td>{p.price}</td>
                <td>{p.description}</td>
                <td>
                  <button onClick={() => handleEdit(p)}>Edit</button>
                  <button onClick={() => handleDelete(p.product_id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No products found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
