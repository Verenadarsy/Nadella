"use client";
import { useEffect, useState } from "react";
import { showAlert } from '@/lib/sweetalert';
import FloatingChat from "../floatingchat"
import { Users, Edit2, Trash2, X, Save, Plus, Mail, Phone, MapPin, Calendar, Search, User } from 'lucide-react';
import SectionLoader from '../components/sectionloader'
import { useLanguage } from '@/lib/languageContext'

export default function CustomersPage() {
  const { language, t } = useLanguage()
  const texts = t.customers[language]

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    pic_id: "",
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [picSearch, setPicSearch] = useState("");
  const [isPicDropdownOpen, setIsPicDropdownOpen] = useState(false);

  useEffect(() => {
    // Detect dark mode from parent layout
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true });

    fetchData();
    fetchAdminUsers();

    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.pic-dropdown-container')) {
        setIsPicDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      observer.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter customers berdasarkan search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter((cust) =>
        cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.pic_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  // Ambil semua data customer
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customers");
      const data = await res.json();
      const customersData = Array.isArray(data) ? data : [];
      setCustomers(customersData);
      setFilteredCustomers(customersData);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Ambil data admin users untuk dropdown PIC
  const fetchAdminUsers = async () => {
    try {
      const res = await fetch("/api/users?role=admin");
      const data = await res.json();
      setAdminUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching admin users:", err);
    }
  };

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
        showAlert({
          icon: 'success',
          title: texts.success,
          text: editing ? texts.customerUpdated : texts.customerAdded,
          showConfirmButton: false,
          timer: 1500
        }, darkMode);
        setFormData({ name: "", email: "", phone: "", address: "", pic_id: "" });
        setEditing(null);
        fetchData();
      } else {
        showAlert({
          icon: 'error',
          title: texts.failed,
          text: texts.unableToSave
        }, darkMode);
      }
    } catch (err) {
      console.error("handleSubmit error:", err);
      showAlert({
        icon: 'error',
        title: texts.error,
        text: texts.connectionError
      }, darkMode);
    }
  };

  const handleEdit = (cust) => {
    setFormData({
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      address: cust.address,
      pic_id: cust.pic_id || "",
    });
    setEditing(cust);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const confirm = await showAlert({
      title: texts.deleteCustomer,
      text: texts.cannotUndo,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: texts.yesDelete,
      cancelButtonText: texts.cancel,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode);

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (res.ok) {
        showAlert({
          icon: 'success',
          title: texts.deleted,
          text: texts.customerDeleted,
          showConfirmButton: false,
          timer: 1500
        }, darkMode);
        fetchData();
      } else {
        showAlert({
          icon: 'error',
          title: texts.failed,
          text: texts.unableToDelete
        }, darkMode);
      }
    } catch (err) {
      console.error("handleDelete error:", err);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", email: "", phone: "", address: "", pic_id: "" });
    setEditing(null);
  };

  // Filter admin users berdasarkan search di dropdown
  const filteredAdminUsers = adminUsers.filter((user) =>
    user.name.toLowerCase().includes(picSearch.toLowerCase())
  );

  // Get selected PIC name
  const selectedPicName = adminUsers.find(u => u.user_id === formData.pic_id)?.name || (texts.selectPIC);

  return (
    <div className={`min-h-screen p-8 transition-colors ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto">

        {/* FORM */}
        <div className={`rounded-xl shadow-lg p-8 mb-8 transition-colors ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {editing ? (
              <>
                <Edit2 className="w-7 h-7" />
                {texts.editCustomer}
              </>
            ) : (
              <>
                <Plus className="w-7 h-7" />
                {texts.addNewCustomer}
              </>
            )}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Name */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {texts.customerName}
                </label>

                <div className="relative">
                  <User
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  />

                  <input
                    type="text"
                    name="name"
                    placeholder={texts.customerNamePlaceholder || "e.g. John Doe"}
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors outline-none ${
                      darkMode
                        ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                        : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                    }`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {texts.email}
                </label>

                <div className="relative">
                  <Mail
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder={texts.emailPlaceholder || "e.g. john@example.com"}
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors outline-none ${
                      darkMode
                        ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                        : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                    }`}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {texts.phone}
                </label>

                <div className="relative">
                  <Phone
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      darkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  />

                  <input
                    type="text"
                    name="phone"
                    placeholder={texts.phonePlaceholder || "e.g. +62 812 3456 7890"}
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors outline-none ${
                      darkMode
                        ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                        : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                    }`}
                  />
                </div>
              </div>

              {/* PIC dengan Dropdown Custom */}
              <div className="relative pic-dropdown-container">
                <label className={`block text-sm font-medium mb-2 ${ darkMode ? 'text-slate-300' : 'text-slate-700' }`}>
                  {texts.pic || 'PIC (Person In Charge)'}
                </label>

                {/* Dropdown Button */}
                <button
                  type="button"
                  onClick={() => setIsPicDropdownOpen(!isPicDropdownOpen)}
                  className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors outline-none text-left flex items-center justify-between ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                      : 'bg-white border-gray-200 text-slate-900 focus:border-blue-600'
                  }`}
                >
                  <span className={!formData.pic_id ? (darkMode ? 'text-slate-500' : 'text-slate-400') : ''}>
                    {selectedPicName}
                  </span>
                  <svg className={`w-5 h-5 transition-transform ${isPicDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isPicDropdownOpen && (
                  <div className={`absolute z-10 w-full mt-1 rounded-lg border-2 shadow-lg ${
                    darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'
                  }`}>
                    {/* Search Input */}
                    <div className="p-2 border-b-2" style={{ borderColor: darkMode ? '#475569' : '#E2E8F0' }}>
                      <div className="relative">
                        <input
                          type="text"
                          value={picSearch}
                          onChange={(e) => setPicSearch(e.target.value)}
                          placeholder={texts.searchPIC}
                          className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 transition-colors outline-none ${
                            darkMode
                              ? 'bg-slate-600 border-slate-500 text-white placeholder-slate-400 focus:border-blue-500'
                              : 'bg-gray-50 border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Search className={`absolute left-3 top-2.5 w-5 h-5 ${
                          darkMode ? 'text-slate-400' : 'text-slate-400'
                        }`} />
                      </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto" style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}>
                      <style jsx>{`
                        div::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, pic_id: '' });
                          setIsPicDropdownOpen(false);
                          setPicSearch('');
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-opacity-50 transition-colors ${
                          darkMode ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-gray-100 text-slate-400'
                        }`}
                      >
                        {texts.selectPIC}
                      </button>
                      {filteredAdminUsers.map((user) => (
                        <button
                          key={user.user_id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, pic_id: user.user_id });
                            setIsPicDropdownOpen(false);
                            setPicSearch('');
                          }}
                          className={`w-full px-4 py-2 text-left transition-colors ${
                            formData.pic_id === user.user_id
                              ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                              : (darkMode ? 'hover:bg-slate-600 text-white' : 'hover:bg-gray-100 text-slate-900')
                          }`}
                        >
                          {user.name}
                        </button>
                      ))}
                      {filteredAdminUsers.length === 0 && (
                        <div className={`px-4 py-2 text-center ${
                          darkMode ? 'text-slate-400' : 'text-slate-400'
                        }`}>
                          {texts.noResults || 'Tidak ada hasil'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address - Full Width */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  darkMode ? "text-slate-300" : "text-slate-700"
                }`}
              >
                {texts.address}
              </label>

              <div className="relative">
                <MapPin
                  className={`absolute left-3 top-3 w-4 h-4 ${
                    darkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                />

                <textarea
                  name="address"
                  placeholder={texts.addressPlaceholder || "e.g. Jl. Merdeka No. 123, Bandung"}
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors outline-none resize-none ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                      : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                  }`}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                  editing
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } shadow-lg hover:shadow-xl`}
              >
                {editing ? (
                  <>
                    <Save className="w-5 h-5" />
                    {texts.updateCustomer}
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    {texts.addCustomer}
                  </>
                )}
              </button>

              {editing && (
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

        {/* CUSTOMERS LIST */}
        <div className={`rounded-xl shadow-lg p-8 transition-colors ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold flex items-center gap-3 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Users className="w-7 h-7" />
              {texts.customersList} ({filteredCustomers.length})
            </h2>

            {/* Search Bar */}
            <div className="relative w-full max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={texts.searchCustomers || 'Cari customer...'}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <Search className={`absolute left-3 top-2.5 w-5 h-5 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
          </div>

          {loading ? (
            <SectionLoader />
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className={`w-16 h-16 mx-auto mb-4 ${
                darkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <p className={`text-lg ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {searchQuery ? (texts.noResults || 'Tidak ada hasil yang ditemukan') : texts.noCustomersYet}
              </p>
              <p className={`text-sm mt-2 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {searchQuery ? (texts.tryDifferentKeyword || 'Coba kata kunci lain') : texts.createFirst}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b-2 ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {texts.customerNameHeader}
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {texts.emailHeader}
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {texts.phoneHeader}
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {texts.addressHeader}
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {texts.pic || 'PIC'}
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {texts.createdAt}
                    </th>
                    <th className={`px-4 py-3 text-center text-sm font-semibold w-32 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {texts.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust) => (
                    <tr
                      key={cust.customer_id}
                      className={`border-b transition-colors ${
                        darkMode
                          ? 'border-gray-700 hover:bg-gray-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <td className={`px-4 py-3 ${
                        darkMode ? 'text-gray-200' : 'text-gray-900'
                      }`}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">{cust.name}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {cust.email}
                      </td>
                      <td className={`px-4 py-3 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {cust.phone || '-'}
                      </td>
                      <td className={`px-4 py-3 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {cust.address ? (
                          <span
                            className={`line-clamp-2 ${cust.address.length > 40 ? 'cursor-pointer' : ''}`}
                            title={cust.address.length > 40 ? cust.address : undefined}
                          >
                            {cust.address}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className={`px-4 py-3 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {cust.pic_name || '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {new Date(cust.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 w-32">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(cust)}
                            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                              darkMode
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            }`}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cust.customer_id)}
                            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
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
    </div>
  );
}