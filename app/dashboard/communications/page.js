"use client";
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import {
  MessageSquare, Edit2, Trash2, X, Save, Plus,
  Mail, Phone, MessageCircle, Send, User, Clock
} from 'lucide-react';
import FloatingChat from "../floatingchat"

export default function CommunicationsPage() {
  const [communications, setCommunications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    type: "email",
    content: "",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    // Detect dark mode from parent layout
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true });

    fetchData();
    fetchCustomers();

    return () => observer.disconnect();
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

  function getCurrentTimestamp() {
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return wib.toISOString().slice(0, 19).replace("T", " ");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form };

    if (!editingId) {
      payload.timestamp = getCurrentTimestamp();
      await fetch("/api/communications", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      Swal.fire({
        icon: 'success',
        title: 'Sukses!',
        text: 'Communication berhasil ditambahkan!',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      payload.communication_id = editingId;
      await fetch("/api/communications", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      Swal.fire({
        icon: 'success',
        title: 'Sukses!',
        text: 'Communication berhasil diperbarui!',
        showConfirmButton: false,
        timer: 1500
      });
      setEditingId(null);
    }

    setForm({ customer_id: "", type: "email", content: "" });
    fetchData();
  }

  async function handleDelete(id) {
    const confirm = await Swal.fire({
      title: 'Hapus communication ini?',
      text: 'Tindakan ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (confirm.isConfirmed) {
      await fetch("/api/communications", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      Swal.fire({
        icon: 'success',
        title: 'Dihapus!',
        text: 'Communication berhasil dihapus.',
        showConfirmButton: false,
        timer: 1500
      });
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
              Edit Communication
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add New Communication
            </>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Select */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Customer
              </label>
              <select
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                required
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 focus:border-blue-600'
                } outline-none`}
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Select */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Communication Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
                className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-200 text-slate-900 focus:border-blue-600'
                } outline-none`}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="chat">Chat</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>

          {/* Content Textarea */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Content
            </label>
            <textarea
              placeholder="Enter communication content..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              rows="4"
              className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors resize-none ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                  : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
              } outline-none`}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                editingId
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg hover:shadow-xl`}
            >
              {editingId ? (
                <>
                  <Save className="w-5 h-5" />
                  Update Communication
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Communication
                </>
              )}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ customer_id: "", type: "email", content: "" });
                }}
                className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* COMMUNICATIONS LIST */}
      <div className={`rounded-xl overflow-hidden shadow-lg ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-6 py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Communications List ({communications.length})
          </h2>
        </div>

        {communications.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-slate-600' : 'text-gray-300'
            }`} />
            <p className={`text-lg font-medium ${
              darkMode ? 'text-slate-400' : 'text-gray-500'
            }`}>
              No communications yet
            </p>
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>
              Create your first communication above
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
                    Customer
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Type
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Content
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Timestamp
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {communications.map((item) => (
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