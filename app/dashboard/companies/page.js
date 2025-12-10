'use client'
import { useEffect, useState } from 'react'
import { showAlert } from '@/lib/sweetalert';
import FloatingChat from "../floatingchat"
import {
  Building2, Edit2, Trash2, X, Save, Plus,
  Globe, MapPin, Briefcase, Calendar, Search
} from 'lucide-react'
import SectionLoader from '../components/sectionloader'
import { useLanguage } from '@/lib/languageContext'

export default function CompaniesPage() {
  const { language, t } = useLanguage()
  const texts = t.companies[language]
  const [companies, setCompanies] = useState([])
  const [filteredCompanies, setFilteredCompanies] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [form, setForm] = useState({
    company_id: '',
    company_name: '',
    industry: '',
    website: '',
    address: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Detect dark mode from parent layout
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchCompanies()

    return () => observer.disconnect()
  }, [])

  // Filter companies berdasarkan search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCompanies(companies)
    } else {
      const filtered = companies.filter((company) =>
        company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.website?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.address?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredCompanies(filtered)
    }
  }, [searchQuery, companies])

  // Fetch all companies
  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/companies')
      const data = await res.json()
      const companiesData = Array.isArray(data) ? data : []
      setCompanies(companiesData)
      setFilteredCompanies(companiesData)
    } finally {
      setLoading(false)
    }
  }

  // Input handler
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault()

    const url = '/api/companies'
    const method = isEditing ? 'PUT' : 'POST'

    // FIX UTAMA → Jangan kirim company_id saat ADD
    const payload = { ...form }
    if (!isEditing) {
      delete payload.company_id
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      showAlert({
        icon: 'success',
        title: texts.success,
        text: isEditing ? texts.companyUpdated : texts.companyAdded,
        showConfirmButton: false,
        timer: 1500
      }, darkMode)
      setForm({ company_id: '', company_name: '', industry: '', website: '', address: '' })
      setIsEditing(false)
      fetchCompanies()
    } else {
      const err = await res.json()
      showAlert({
        icon: 'error',
        title: texts.failed,
        text: err.message || texts.unableToSaveCompany
      }, darkMode)
    }
  }

  // Delete company
  const handleDelete = async (id) => {
    const confirm = await showAlert({
      title: texts.deleteCompany,
      text: texts.cannotUndo,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: texts.yesDelete,
      cancelButtonText: texts.cancel,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode)

    if (!confirm.isConfirmed) return

    const res = await fetch('/api/companies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if (res.ok) {
      showAlert({
        icon: 'success',
        title: texts.deleted,
        text: texts.companyDeleted,
        showConfirmButton: false,
        timer: 1500
      }, darkMode)
      fetchCompanies()
    } else {
      const err = await res.json()
      showAlert({
        icon: 'error',
        title: texts.failed,
        text: err.message || texts.unableToDelete
      }, darkMode)
    }
  }

  // Load data for editing
  const handleEdit = (company) => {
    setForm(company)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Cancel edit mode
  const handleCancel = () => {
    setForm({ company_id: '', company_name: '', industry: '', website: '', address: '' })
    setIsEditing(false)
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
          {isEditing ? (
            <>
              <Edit2 className="w-5 h-5" />
              {texts.editCompany}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {texts.addNewCompany}
            </>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.companyName}
              </label>
              <div className="relative">
                <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  name="company_name"
                  placeholder={texts.companyNamePlaceholder}
                  value={form.company_name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                      : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                  } outline-none`}
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.industry}
              </label>
              <div className="relative">
                <Briefcase className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  name="industry"
                  placeholder={texts.industryPlaceholder}
                  value={form.industry}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                      : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                  } outline-none`}
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.website}
              </label>
              <div className="relative">
                <Globe className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  name="website"
                  placeholder={texts.websitePlaceholder}
                  value={form.website}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                      : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                  } outline-none`}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.address}
              </label>
              <div className="relative">
                <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  name="address"
                  placeholder={texts.addressPlaceholder}
                  value={form.address}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-2.5 rounded-lg border-2 transition-colors ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                      : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
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
                isEditing
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg hover:shadow-xl`}
            >
              {isEditing ? (
                <>
                  <Save className="w-5 h-5" />
                  {texts.updateCompany}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {texts.addCompany}
                </>
              )}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
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

      {/* COMPANIES LIST */}
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className={`text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {texts.companiesList} ({filteredCompanies.length})
            </h2>

            {/* Search Bar */}
            <div className="relative w-full max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={texts.searchCompanies || "Cari perusahaan..."}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 transition-colors outline-none ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                }`}
              />
              <Search className={`absolute left-3 top-2.5 w-5 h-5 ${
                darkMode ? 'text-slate-400' : 'text-slate-400'
              }`} />
            </div>
          </div>
        </div>

        {loading ? (
          <SectionLoader darkMode={darkMode} text={texts.loadingCompanies} />
        ) : filteredCompanies.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {searchQuery ? (texts.noResults || 'Tidak ada hasil yang ditemukan') : texts.noCompaniesYet}
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {searchQuery ? (texts.tryDifferentKeyword || 'Coba kata kunci lain') : texts.createFirst}
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
                    {texts.companyNameHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.industryHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.websiteHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.addressHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.createdAt}
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.actions}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {filteredCompanies.map((c) => (
                  <tr key={c.company_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 ${
                      darkMode ? 'text-slate-300' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{c.company_name}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      {c.industry || '-'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      {c.website ? (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 hover:underline truncate block max-w-[200px]"
                        >
                          {c.website}
                        </a>
                      ) : (
                        <span className={darkMode ? 'text-slate-500' : 'text-gray-400'}>-</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      {c.address ? (
                        <span
                          className={`truncate block max-w-[200px] ${c.address.length > 30 ? 'cursor-pointer' : ''}`}
                          title={c.address.length > 30 ? c.address : undefined}
                        >
                          {c.address}
                        </span>
                      ) : (
                        <span className={darkMode ? 'text-slate-500' : 'text-gray-400'}>-</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      {new Date(c.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(c)}
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
                          onClick={() => handleDelete(c.company_id)}
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