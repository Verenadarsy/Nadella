"use client";

import { useEffect, useState } from "react";
import { showAlert } from '@/lib/sweetalert';
import FloatingChat from "../floatingchat"
import {
  Users, Edit2, Trash2, X, Save, Plus,
  Mail, Phone, MapPin, Calendar, User
} from 'lucide-react';
import SectionLoader from '../components/sectionloader'
import { useLanguage } from '@/lib/languageContext'

export default function CustomersPage() {
  const { language, t } = useLanguage()
  const texts = t.customers[language]
  const [customers, setCustomers] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect dark mode from parent layout
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true });

    fetchData();

    return () => observer.disconnect();
  }, []);

    // Ambil semua data customer
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
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
        setFormData({ name: "", email: "", phone: "", address: "" });
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
    setFormData({ name: "", email: "", phone: "", address: "" });
    setEditing(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* FORM */}
      <div className={`rounded-xl p-6 mb-6 shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {editing ? (
            <>
              <Edit2 className="w-5 h-5" />
              {texts.editCustomer}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
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
                  placeholder={texts.customerNamePlaceholder}
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
                  placeholder={texts.emailPlaceholder}
                  value={formData.email}
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
                  placeholder={texts.phonePlaceholder}
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

            {/* Address */}
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
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    darkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                />

                <input
                  type="text"
                  name="address"
                  placeholder={texts.addressPlaceholder}
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors outline-none ${
                    darkMode
                      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500"
                      : "bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600"
                  }`}
                />
              </div>
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
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            {texts.customersList} ({customers.length})
          </h2>
        </div>

        {loading ? (
          <SectionLoader darkMode={darkMode} text={texts.loadingCustomers} />
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {texts.noCustomersYet}
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {texts.createFirst}
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
                    {texts.customerNameHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.emailHeader}
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.phoneHeader}
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
                {customers.map((cust) => (
                  <tr key={cust.customer_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 ${
                      darkMode ? 'text-slate-300' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{cust.name}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {cust.email}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {cust.phone || '-'}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{cust.address || '-'}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(cust.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(cust)}
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
                          onClick={() => handleDelete(cust.customer_id)}
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
  );
}