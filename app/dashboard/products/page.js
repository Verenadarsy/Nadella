"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { showAlert } from '@/lib/sweetalert';
import FloatingChat from "../floatingchat"
import {
  Package, Edit2, Trash2, X, Save, Plus,
  Banknote, FileText, Search, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react'
import SectionLoader from '../components/sectionloader'
import { useLanguage } from '@/lib/languageContext'

export default function ProductsCRUD() {
  const router = useRouter()
  const { language, t } = useLanguage()
  const texts = t.products[language]
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [form, setForm] = useState({ product_name: "", price: "", description: "" })
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState(null) // null, 'name', atau 'price'
  const [sortDirection, setSortDirection] = useState('asc') // 'asc' atau 'desc'
  const [userRole, setUserRole] = useState(null)

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
    setUserRole(roleCookie)

    fetchProducts()

    return () => observer.disconnect()
  }, [router])

  // Filter products
  useEffect(() => {
    let result = [...products]

    // Filter berdasarkan search query
    if (searchQuery.trim() !== "") {
      result = result.filter((product) =>
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.price?.toString().includes(searchQuery)
      )
    }

    // Sort berdasarkan kolom yang dipilih
    if (sortBy === 'name') {
      result.sort((a, b) => {
        const compare = a.product_name.localeCompare(b.product_name)
        return sortDirection === 'asc' ? compare : -compare
      })
    } else if (sortBy === 'price') {
      result.sort((a, b) => {
        const compare = Number(a.price) - Number(b.price)
        return sortDirection === 'asc' ? compare : -compare
      })
    }

    setFilteredProducts(result)
  }, [searchQuery, products, sortBy, sortDirection])

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle direction kalau kolom sama
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set kolom baru dengan asc
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 text-slate-400" />
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/products")
      const data = await res.json()
      const productsData = Array.isArray(data) ? data : []
      setProducts(productsData)
      setFilteredProducts(productsData)
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
    if (userRole !== 'superadmin') {
    showAlert({
      icon: 'error',
      title: texts.accessDenied || 'Akses Ditolak',
      text: 'Hanya Superadmin yang dapat menghapus produk'
    }, darkMode)
    return
  }
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* FORM */}
      <div className={`rounded-2xl p-4 sm:p-6 shadow-xl transition-all duration-300 ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Product Name */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.productName}
              </label>
              <div className="relative">
                <Package className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  name="product_name"
                  placeholder={texts.productNamePlaceholder}
                  value={form.product_name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-colors ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                  } outline-none`}
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.price}
              </label>
              <div className="relative">
                <Banknote className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="number"
                  name="price"
                  placeholder={texts.pricePlaceholder}
                  value={form.price}
                  onChange={handleChange}
                  required
                  className={`w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-colors ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                  } outline-none`}
                />
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.description}
              </label>
              <div className="relative">
                <FileText className={`absolute left-2.5 sm:left-3 top-3 w-4 h-4 sm:w-5 sm:h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <textarea
                  name="description"
                  placeholder={texts.descriptionPlaceholder}
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-colors resize-none ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                  } outline-none`}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="submit"
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                editId
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg hover:shadow-xl`}
            >
              {editId ? (
                <>
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  {texts.updateProduct}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
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
                className={`px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                {texts.cancel}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* PRODUCTS LIST */}
      <div className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <h2 className={`text-base sm:text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {texts.productsList} ({filteredProducts?.length || 0})
            </h2>

            {/* SEARCH BOX */}
            <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={texts.searchProducts}
                className={`w-full pl-9 pr-3 sm:pl-10 sm:pr-4 py-2 text-sm sm:text-base rounded-lg border-2 transition-colors outline-none ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                }`}
              />
              <Search className={`absolute left-2.5 sm:left-3 top-2 sm:top-2.5 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none ${
                darkMode ? 'text-slate-400' : 'text-slate-400'
              }`} />
            </div>
          </div>
        </div>

        {loading ? (
          <SectionLoader darkMode={darkMode} text={texts.loadingProducts} />
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Package className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-base sm:text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {searchQuery ? (texts.noResults || 'Tidak ada hasil yang ditemukan') : texts.noProductsYet}
            </p>
            <p className={`text-xs sm:text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {searchQuery ? (texts.tryDifferentKeyword || 'Coba kata kunci lain') : texts.createFirstProduct}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[640px]">
              <thead className={darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr>
                  {/* PRODUCT NAME - CLICKABLE */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 hover:text-blue-500 transition-colors uppercase"
                    >
                      {texts.productNameHeader}
                      {getSortIcon('name')}
                    </button>
                  </th>

                  {/* PRICE - CLICKABLE */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    <button
                      onClick={() => handleSort('price')}
                      className="flex items-center gap-2 hover:text-blue-500 transition-colors uppercase"
                    >
                      {texts.priceHeader}
                      {getSortIcon('price')}
                    </button>
                  </th>

                  {/* DESCRIPTION - NO SORT */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.descriptionHeader}
                  </th>
                  {/* ACTIONS - NO SORT */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider w-28 sm:w-32 ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.actions}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {filteredProducts.map((product) => (
                  <tr key={product.product_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{product.product_name}</span>
                      </div>
                    </td>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          Rp {Number(product.price).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </td>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-900'
                    }`}>
                      <div className="max-w-xs truncate">
                        {product.description || '-'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center w-28 sm:w-32">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
                            darkMode
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          }`}
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        {userRole === 'superadmin' && (
                          <button
                            onClick={() => handleDelete(product.product_id)}
                            className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
                              darkMode
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
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