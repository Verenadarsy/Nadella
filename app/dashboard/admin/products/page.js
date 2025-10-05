"use client"
import { useEffect, useState } from "react"

export default function ProductsCRUD() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ product_name: "", price: "", description: "" })
  const [editId, setEditId] = useState(null)

  const fetchProducts = async () => {
    const res = await fetch("/api/products")
    const data = await res.json()
    setProducts(data)
  }

  useEffect(() => { fetchProducts() }, [])

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
    if (!confirm("Delete this product?")) return
    await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    fetchProducts()
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Products CRUD</h1>
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

      <table border="1" cellPadding="8">
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
            <tr><td colSpan="4">No products found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
