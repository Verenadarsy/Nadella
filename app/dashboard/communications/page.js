"use client";
import { useEffect, useState } from "react";
import { showAlert } from '@/lib/sweetalert';
import {
  MessageSquare, Edit2, Trash2, X, Save, Plus,
  Mail, Phone, MessageCircle, Send, User, Clock, ChevronDown, FileText,
  Search, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import FloatingChat from "../floatingchat"
import SectionLoader from '../components/sectionloader'
import { useLanguage } from '@/lib/languageContext'

export default function CommunicationsPage() {
  const { language, t } = useLanguage()
  const texts = t.communications[language]
  const [communications, setCommunications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    type: "",
    content: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCommunications, setFilteredCommunications] = useState([]);
  const [sortBy, setSortBy] = useState(null); // null, 'customer', atau 'type'
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true });

    fetchData();
    fetchCustomers();

    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.customer-dropdown-container')) {
        setCustomerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      observer.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter communications berdasarkan search query
  useEffect(() => {
    let result = [...communications];

    // Filter berdasarkan search query
    if (searchQuery.trim() !== "") {
      result = result.filter((comm) => {
        const customerName = customers.find(c => c.customer_id === comm.customer_id)?.name || "";
        return (
          customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comm.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comm.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Sort berdasarkan kolom yang dipilih
    if (sortBy === 'customer') {
      result.sort((a, b) => {
        const nameA = customers.find(c => c.customer_id === a.customer_id)?.name || '';
        const nameB = customers.find(c => c.customer_id === b.customer_id)?.name || '';
        const compare = nameA.localeCompare(nameB);
        return sortDirection === 'asc' ? compare : -compare;
      });
    } else if (sortBy === 'type') {
      // Urutan type: email -> phone -> chat -> whatsapp
      const typeOrder = { email: 1, phone: 2, chat: 3, whatsapp: 4 };
      result.sort((a, b) => {
        const compare = (typeOrder[a.type] || 999) - (typeOrder[b.type] || 999);
        return sortDirection === 'asc' ? compare : -compare;
      });
    }

    setFilteredCommunications(result);
  }, [searchQuery, communications, customers, sortBy, sortDirection]);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch("/api/communications");
      const data = await res.json();
      const commData = Array.isArray(data) ? data : [];
      setCommunications(commData);
      setFilteredCommunications(commData);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers() {
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(data);
  }

  function getCurrentTimestamp() {
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return wib.toISOString().slice(0, 19).replace("T", " ");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.customer_id || !form.type || !form.content) {
      showAlert({
        icon: 'warning',
        title: texts.warning,
        text: texts.allFieldsRequired
      }, darkMode);
      return;
    }

    const payload = { ...form };

    if (!editingId) {
      payload.timestamp = getCurrentTimestamp();
      await fetch("/api/communications", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      showAlert({
        icon: 'success',
        title: texts.success,
        text: texts.communicationAdded,
        showConfirmButton: false,
        timer: 1500
      }, darkMode);
    } else {
      payload.communication_id = editingId;
      await fetch("/api/communications", {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      showAlert({
        icon: 'success',
        title: texts.success,
        text: texts.communicationUpdated,
        showConfirmButton: false,
        timer: 1500
      }, darkMode);
      setEditingId(null);
    }

    setForm({ customer_id: "", type: "", content: "" });
    fetchData();
  }

  async function handleDelete(id) {
    const confirm = await showAlert({
      title: texts.deleteCommunication,
      text: texts.cannotUndo,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: texts.yesDelete,
      cancelButtonText: texts.cancel,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode);

    if (confirm.isConfirmed) {
      await fetch("/api/communications", {
        method: "DELETE",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      showAlert({
        icon: 'success',
        title: texts.deleted,
        text: texts.communicationDeleted,
        showConfirmButton: false,
        timer: 1500
      }, darkMode);
      fetchData();
    }
  }

  async function handleEdit(item) {
    setEditingId(item.communication_id);
    setForm({
      customer_id: item.customer_id,
      type: item.type,
      content: item.content,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const getTypeIcon = (type) => {
    switch(type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'chat': return <MessageCircle className="w-4 h-4" />;
      case 'whatsapp': return <Send className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'email':
        return darkMode ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : 'bg-blue-100 text-blue-700 border-blue-200';
      case 'phone':
        return darkMode ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-green-100 text-green-700 border-green-200';
      case 'chat':
        return darkMode ? 'bg-purple-600/20 text-purple-400 border-purple-600/30' : 'bg-purple-100 text-purple-700 border-purple-200';
      case 'whatsapp':
        return darkMode ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return darkMode ? 'bg-gray-600/20 text-gray-400 border-gray-600/30' : 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const typeOptions = [
    { value: 'email', label: texts.email, icon: <Mail className="w-4 h-4" /> },
    { value: 'phone', label: texts.phone, icon: <Phone className="w-4 h-4" /> },
    { value: 'chat', label: texts.chat, icon: <MessageCircle className="w-4 h-4" /> },
    { value: 'whatsapp', label: texts.whatsapp, icon: <Send className="w-4 h-4" /> }
  ];

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle direction kalau kolom sama
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set kolom baru dengan asc
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 text-slate-400" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />;
  };

  // Filter customers berdasarkan search di dropdown
  const filteredCustomers = customers.filter((cust) =>
    cust.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* FORM */}
      <div className={`rounded-xl p-6 mb-6 shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {editingId ? (
            <>
              <Edit2 className="w-5 h-5" />
              {texts.editCommunication}
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              {texts.addNewCommunication}
            </>
          )}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Dropdown */}
            <div className="relative customer-dropdown-container">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.customer}
              </label>

              <button
                type="button"
                onClick={() => setCustomerOpen(!customerOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span className={`flex items-center gap-2 ${
                  form.customer_id ? "opacity-90" : "opacity-60"
                }`}>
                  <User size={16} className="opacity-60" />
                  {form.customer_id
                    ? customers.find((c) => c.customer_id === form.customer_id)?.name
                    : texts.selectCustomer}
                </span>
                <ChevronDown size={18} className={`opacity-60 transition-transform ${customerOpen ? 'rotate-180' : ''}`} />
              </button>

              {customerOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`}>
                  {/* Search Input */}
                  <div className="p-2 border-b-2" style={{ borderColor: darkMode ? '#475569' : '#E2E8F0' }}>
                    <div className="relative">
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder={texts.searchCustomer}
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
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.customer_id}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, customer_id: c.customer_id })
                          setCustomerOpen(false)
                          setCustomerSearch('')
                        }}
                        className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                          form.customer_id === c.customer_id
                            ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                            : (darkMode ? "hover:bg-slate-600" : "hover:bg-slate-100")
                        }`}
                      >
                        <User size={16} className="opacity-70" />
                        {c.name}
                      </button>
                    ))}
                    {filteredCustomers.length === 0 && (
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

            {/* Type Dropdown */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {texts.communicationType}
              </label>

              <button
                type="button"
                onClick={() => setTypeOpen(!typeOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-slate-50 border-gray-200 text-slate-900"
                }`}
              >
                <span className={`flex items-center gap-2 ${
                  form.type ? "opacity-90" : "opacity-60"
                }`}>
                  {form.type ? (
                    <>
                      {typeOptions.find(t => t.value === form.type)?.icon}
                      {typeOptions.find(t => t.value === form.type)?.label}
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      {texts.selectType}
                    </>
                  )}
                </span>
                <ChevronDown size={18} className="opacity-60" />
              </button>

              {typeOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 max-h-60 overflow-y-auto ${
                  darkMode
                    ? "bg-slate-700 border-slate-600 text-white"
                    : "bg-white border-gray-200 text-slate-900"
                }`} style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}>
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {typeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, type: option.value })
                        setTypeOpen(false)
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2 transition-colors ${
                        darkMode ? "hover:bg-slate-600" : "hover:bg-slate-100"
                      }`}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content Textarea */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {texts.content}
            </label>
            <div className="relative">
              <FileText className={`absolute left-3 top-3 w-4 h-4 ${
                darkMode ? "text-slate-500" : "text-slate-500"
              }`} />
              <textarea
                placeholder={texts.enterCommunicationContent}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
                rows="4"
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border-2 transition-colors resize-none outline-none ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                }`}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                editingId
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg hover:shadow-xl`}
            >
              {editingId ? (
                <>
                  <Save className="w-5 h-5" />
                  {texts.updateCommunication}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {texts.addCommunication}
                </>
              )}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ customer_id: "", type: "", content: "" });
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
        </div>
      </div>

      {/* COMMUNICATIONS LIST */}
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              {texts.communicationsList} ({filteredCommunications.length})
            </h2>

            {/* Search Bar */}
            <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={texts.searchCommunications}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-gray-300 text-slate-900 placeholder-slate-500'
                }`}
              />
              <Search className={`absolute left-3 top-2.5 w-5 h-5 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`} />
            </div>
          </div>
        </div>

        {loading ? (
          <SectionLoader darkMode={darkMode} text={texts.loadingCommunications} />
        ) : filteredCommunications.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              {searchQuery ? (texts.noResults || 'Tidak ada hasil yang ditemukan') : texts.noCommunicationsYet}
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              {searchQuery ? (texts.tryDifferentKeyword || 'Coba kata kunci lain') : texts.createFirstCommunicationAbove}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr>
                  {/* CUSTOMER - CLICKABLE SORT */}
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    <button
                      onClick={() => handleSort('customer')}
                      className="flex items-center gap-2 hover:text-blue-500 transition-colors uppercase"
                    >
                      {texts.customerHeader}
                      {getSortIcon('customer')}
                    </button>
                  </th>

                  {/* TYPE - CLICKABLE SORT */}
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    <button
                      onClick={() => handleSort('type')}
                      className="flex items-center gap-2 hover:text-blue-500 transition-colors uppercase"
                    >
                      {texts.type}
                      {getSortIcon('type')}
                    </button>
                  </th>

                  {/* CONTENT - NO SORT, UPPERCASE */}
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.contentHeader}
                  </th>

                  {/* TIMESTAMP - NO SORT, UPPERCASE, WHITESPACE NOWRAP */}
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.timestamp}
                  </th>

                  {/* ACTIONS - NO SORT, UPPERCASE */}
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.actions}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {filteredCommunications.map((item) => (
                  <tr key={item.communication_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {customers.find((c) => c.customer_id === item.customer_id)?.name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${
                        getTypeColor(item.type)
                      }`}>
                        {getTypeIcon(item.type)}
                        <span className="capitalize">{item.type}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${
                      darkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      <div className="max-w-xs truncate">
                        {item.content}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(item.timestamp).toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
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
                          onClick={() => handleDelete(item.communication_id)}
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
      <FloatingChat />
    </div>
  );
}