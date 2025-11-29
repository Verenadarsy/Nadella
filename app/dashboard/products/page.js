"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { showAlert } from '@/lib/sweetalert';
import FloatingChat from "../floatingchat"
import {
  Package, Edit2, Trash2, X, Save, Plus,
  Banknote, FileText, ShoppingCart
} from 'lucide-react'
import SectionLoader from '../components/sectionloader'
import { useLanguage } from '@/lib/languageContext'

export default function ProductsCRUD() {
  const router = useRouter()
  const { language, t } = useLanguage()
  const texts = t.products[language]
  const [products, setProducts] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [form, setForm] = useState({ product_name: "", price: "", description: "" })
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Detect dark mode from parent layout
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    const roleCookie = document.cookie
      .split("; ")
      .find((r) => r.startsWith("userRole="))
      ?.split("=")[1]

    if (!roleCookie) {
      showAlert({
        icon: "warning",
        title: texts.accessDenied,
        text: texts.mustBeLoggedIn
      }, darkMode).then(() => router.push("/login?auth=required"))
      return
    }

    if (!(roleCookie === "admin" || roleCookie === "superadmin")) {
      showAlert({
        icon: "error",
        title: texts.accessDenied,
        text: texts.adminOnly
      }, darkMode).then(() => router.push("/dashboard"))
      return
    }

    fetchProducts()

    return () => observer.disconnect()
  }, [router])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/products")
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

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
      showAlert({
        icon: "success",
        title: editId ? texts.productUpdated : texts.productAdded,
        timer: 1500,
        showConfirmButton: false
      }, darkMode)
      setForm({ product_name: "", price: "", description: "" })
      setEditId(null)
      fetchProducts()
    } else {
      showAlert({
        icon: 'error',
        title: texts.failed,
        text: texts.errorSaving
      }, darkMode)
    }
  }

  const handleEdit = (p) => {
    setEditId(p.product_id)
    setForm({ product_name: p.product_name, price: p.price, description: p.description })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    const confirm = await showAlert({
      title: texts.deleteProduct,
      text: texts.cannotUndo,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: texts.yesDelete,
      cancelButtonText: texts.cancel,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode)

    if (confirm.isConfirmed) {
      await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      showAlert({
        icon: 'success',
        title: texts.deleted,
        text: texts.productDeleted,
        showConfirmButton: false,
        timer: 1500
      }, darkMode)
      fetchProducts()
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* FORM */}
      <div className={`rounded-xl p-6 mb-6 shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {editId ? (
            <>
              <Edit2 className="w-5 h-5" />
              {texts.editProduct}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {texts.addNewProduct}
            </>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.productName}
              </label>
              <div className="relative">
                <Package className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  name="product_name"
                  placeholder={texts.productNamePlaceholder}
                  value={form.product_name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                  } outline-none`}
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.price} (Rp)
              </label>
              <div className="relative">
                <Banknote className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="number"
                  name="price"
                  placeholder={texts.pricePlaceholder}
                  value={form.price}
                  onChange={handleChange}
                  required
                  className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                  } outline-none`}
                />
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.description}
              </label>
              <div className="relative">
                <FileText className={`absolute left-3 top-3 w-5 h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <textarea
                  name="description"
                  placeholder={texts.descriptionPlaceholder}
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors resize-none ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                  } outline-none`}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                editId
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg hover:shadow-xl`}
            >
              {editId ? (
                <>
                  <Save className="w-5 h-5" />
                  {texts.updateProduct}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {texts.addProduct}
                </>
              )}
            </button>

            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null)
                  setForm({ product_name: "", price: "", description: "" })
                }}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <X className="w-5 h-5" />
                {texts.cancel}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* PRODUCTS LIST */}
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            {texts.productsList} ({products?.length || 0})
          </h2>
        </div>

        {loading ? (
          <SectionLoader darkMode={darkMode} text={texts.loadingProducts} />
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {texts.noProductsYet}
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {texts.createFirstProduct}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.productNameHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.priceHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.descriptionHeader}
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.actions}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {products.map((product) => (
                  <tr key={product.product_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span className="font-medium">{product.product_name}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          Rp {Number(product.price).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      <div className="max-w-xs truncate">
                        {product.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          }`}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.product_id)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Floating Chat Imported Here */}
      <FloatingChat />
    </div>
  )
}