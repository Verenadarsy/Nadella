'use client'
import { useEffect, useState } from 'react'
import { showAlert } from '@/lib/sweetalert';
import {
  ShieldCheck, Edit2, Trash2, X, Save, Plus,
  User, Mail, Lock, Calendar, UserCog, Key, Users,
  ChevronDown, Shield, Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff
} from 'lucide-react'
import { useLanguage } from '@/lib/languageContext'
import FloatingChat from "../floatingchat"

export default function ManageUsers() {
  const { language, t } = useLanguage()
  const texts = t.manageAdmins[language]
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password_plain: '',
    role: ''
  })
  const [editId, setEditId] = useState(null)
  const [generatePassword, setGeneratePassword] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [sortBy, setSortBy] = useState(null); // null, 'name', atau 'role'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' atau 'desc'
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { attributes: true })

    fetchUsers()

    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.role-dropdown-container')) {
        setRoleOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      observer.disconnect()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [roleOpen])

  // Filter dan Sort users
  useEffect(() => {
    let result = [...users];

    // Filter berdasarkan search query
    if (searchQuery.trim() !== "") {
      result = result.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort berdasarkan kolom yang dipilih
    if (sortBy === 'name') {
      result.sort((a, b) => {
        const compare = a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? compare : -compare;
      });
    } else if (sortBy === 'role') {
      // Urutan role: client -> admin
      const roleOrder = { client: 1, admin: 2 };
      result.sort((a, b) => {
        const compare = (roleOrder[a.role] || 999) - (roleOrder[b.role] || 999);
        return sortDirection === 'asc' ? compare : -compare;
      });
    }

    setFilteredUsers(result);
  }, [searchQuery, users, sortBy, sortDirection]);

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
      ? <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      : <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
  };

  const fetchUsers = async () => {
    setLoading(true)
    const res = await fetch('/api/users')
    const data = await res.json()
    const userList = data.filter((user) => user.role === 'admin' || user.role === 'client')
    setUsers(userList)
    setFilteredUsers(userList)
    setLoading(false)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name || !form.email || !form.role) {
      showAlert({
        icon: 'warning',
        title: texts.oops,
        text: 'Name, Email, and Role are required!'
      }, darkMode)
      return
    }

    // Validation: password required if not editing and not generating
    if (!editId && !generatePassword && !form.password_plain) {
      showAlert({
        icon: 'warning',
        title: texts.oops,
        text: 'Password is required or enable generate password'
      }, darkMode)
      return
    }

    const method = editId ? 'PUT' : 'POST'
    const body = editId
      ? { ...form, user_id: editId, generate_password: generatePassword }
      : { ...form, generate_password: generatePassword }

    const res = await fetch('/api/users', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const result = await res.json()

    if (res.ok) {
      // Show different message based on generated password
      if (result.generated_password) {
        showAlert({
          icon: 'success',
          title: editId ? 'User Updated!' : 'User Created!',
          html: `<div class="text-center">
            <p class="mb-2">Password has been generated and sent to</p>
            <p class="font-semibold text-blue-600 dark:text-blue-400">${form.email}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Please check the email inbox for login credentials.</p>
          </div>`,
          timer: 3000,
          showConfirmButton: false
        }, darkMode)
      } else {
        showAlert({
          icon: 'success',
          title: editId ? texts.adminUpdated : texts.adminAdded,
          timer: 1500,
          showConfirmButton: false
        }, darkMode)
      }

      setForm({ name: '', email: '', password_plain: '', role: '' })
      setEditId(null)
      setGeneratePassword(false)
      setRoleOpen(false)
      fetchUsers()
    } else {
      showAlert({
        icon: 'error',
        title: texts.failed,
        text: result.error || texts.errorSaving
      }, darkMode)
    }
  }

  const handleEdit = (user) => {
    setEditId(user.user_id)
    setForm({
      name: user.name,
      email: user.email,
      password_plain: '',
      role: user.role
    })
    setGeneratePassword(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    const confirm = await showAlert({
      title: texts.areYouSure,
      text: texts.deleteWarning,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: texts.yesDelete,
      cancelButtonText: texts.cancel,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }, darkMode)
    if (!confirm.isConfirmed) return

    const res = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if (res.ok) {
      showAlert({
        icon: 'success',
        title: texts.deleted,
        text: texts.adminDeleted,
        showConfirmButton: false,
        timer: 1500
      }, darkMode)
      fetchUsers()
    } else {
      showAlert({
        icon: 'error',
        title: texts.failed,
        text: texts.unableToDelete
      }, darkMode)
    }
  }

  const cancelEdit = () => {
    setEditId(null)
    setForm({ name: '', email: '', password_plain: '', role: '' })
    setGeneratePassword(false)
    setRoleOpen(false)
  }

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          Admin
        </span>
      )
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        Client
      </span>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Warning Badge - Super Admin Only */}
      <div className={`rounded-2xl p-3 sm:p-4 ${
        darkMode
          ? 'bg-blue-600/20 border-2 border-blue-600/30'
          : 'bg-blue-50 border-2 border-blue-200'
      }`}>
        <div className="flex items-center gap-3">
          <ShieldCheck className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h3 className={`text-sm sm:text-base font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>
              {texts.superAdminArea}
            </h3>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              {texts.superAdminWarning}
            </p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className={`rounded-2xl p-4 sm:p-6 shadow-xl transition-all duration-300 ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {editId ? (
            <>
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
              Edit User
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Add New User
            </>
          )}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Name Input */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Full Name
              </label>
              <div className="relative">
                <User className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                  className={`w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-colors ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                  } outline-none`}
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  className={`w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-colors ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                  } outline-none`}
                />
              </div>
            </div>

            {/* Role Dropdown */}
            <div className="relative role-dropdown-container">
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                User Role
              </label>

              <button
                type="button"
                onClick={() => setRoleOpen(!roleOpen)}
                className={`w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-colors ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-gray-200 text-slate-900'
                }`}
              >
                <span className={`flex items-center gap-2 ${
                  !form.role ? 'opacity-50' : 'opacity-100'
                }`}>
                  {/* Icon based on role */}
                  {form.role === 'client' && <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  {form.role === 'admin' && <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  {!form.role && <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}

                  {/* Label */}
                  {!form.role ? 'Select User Role' : form.role === 'client' ? 'Client' : 'Admin'}
                </span>

                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${roleOpen ? 'rotate-180' : ''} ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`} />
              </button>

              {roleOpen && (
                <div className={`absolute mt-2 w-full rounded-lg shadow-lg border z-50 ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600'
                    : 'bg-white border-gray-200'
                }`}>
                  {[
                    { value: 'client', label: 'Client', icon: <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
                    { value: 'admin', label: 'Admin', icon: <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> }
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, role: item.value })
                        setRoleOpen(false)
                      }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        darkMode
                          ? 'text-slate-200 hover:bg-slate-600'
                          : 'text-slate-800 hover:bg-slate-100'
                      } ${form.role === item.value ? (darkMode ? 'bg-slate-600' : 'bg-slate-100') : ''}`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                darkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Password {editId && <span className="text-xs opacity-70">(leave blank to keep current)</span>}
              </label>
              <div className="relative">
                <Lock className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password_plain"
                  placeholder={editId ? "Leave blank to keep current" : "Enter password"}
                  value={form.password_plain}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={generatePassword}
                  className={`w-full pl-9 sm:pl-11 pr-10 sm:pr-11 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg border-2 transition-colors ${
                    generatePassword ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                  } outline-none`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={generatePassword}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    generatePassword ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'
                  } transition-opacity`}
                >
                  {showPassword ? (
                    <EyeOff className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  ) : (
                    <Eye className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Generate Password Checkbox */}
          <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg ${
            darkMode ? 'bg-slate-700/50' : 'bg-gray-50'
          }`}>
            <input
              type="checkbox"
              id="generatePassword"
              checked={generatePassword}
              onChange={(e) => {
                setGeneratePassword(e.target.checked)
                if (e.target.checked) {
                  setForm({ ...form, password_plain: '' })
                }
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="generatePassword" className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium cursor-pointer ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Generate secure password automatically
            </label>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-sm sm:text-base rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                editId
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg hover:shadow-xl`}
            >
              {editId ? (
                <>
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  Update User
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Add User
                </>
              )}
            </button>

            {editId && (
              <button
                type="button"
                onClick={cancelEdit}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg font-semibold transition-all flex items-center gap-2 ${
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
        </div>
      </div>

      {/* USERS LIST */}
      <div className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${
          darkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-base sm:text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              All Users ({filteredUsers.length})
            </h2>

            {/* Search Bar */}
            <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={texts.searchUsers}
                className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base rounded-lg border-2 transition-colors outline-none ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-gray-300 text-slate-900 placeholder-slate-500'
                }`}
              />
              <Search className={`absolute left-2.5 sm:left-3 top-2 sm:top-2.5 w-4 h-4 sm:w-5 sm:h-5 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              {texts.loadingAdmins}
            </p>
          </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UserCog className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 ${
                darkMode ? 'text-slate-600' : 'text-gray-300'
              }`} />
              <p className={`text-base sm:text-lg font-medium ${
                darkMode ? 'text-slate-400' : 'text-gray-500'
              }`}>
                {searchQuery ? 'No results found' : 'No users yet'}
              </p>
              <p className={`text-xs sm:text-sm mt-1 ${
                darkMode ? 'text-slate-500' : 'text-gray-400'
              }`}>
                {searchQuery ? 'Try different keywords' : 'Add your first user to get started'}
              </p>
            </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[900px]">
              <thead className={darkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr>
                  {/* NAME - CLICKABLE SORT */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold tracking-wider uppercase ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 hover:text-blue-500 transition-colors uppercase"
                    >
                      {texts.name}
                      {getSortIcon('name')}
                    </button>
                  </th>

                  {/* EMAIL - NO SORT, UPPERCASE */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold tracking-wider uppercase ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.email}
                  </th>

                  {/* ROLE - CLICKABLE SORT */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold tracking-wider uppercase ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    <button
                      onClick={() => handleSort('role')}
                      className="flex items-center gap-2 hover:text-blue-500 transition-colors uppercase"
                    >
                      Role
                      {getSortIcon('role')}
                    </button>
                  </th>

                  {/* CREATED AT - NO SORT, UPPERCASE, WHITESPACE NOWRAP */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold tracking-wider uppercase whitespace-nowrap ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.createdAt}
                  </th>

                  {/* ACTIONS - NO SORT, UPPERCASE */}
                  <th className={`px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    darkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {texts.actions}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className={`transition-colors ${
                    darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                  }`}>
                    <td className={`px-2 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          user.role === 'admin'
                            ? (darkMode ? 'bg-purple-600' : 'bg-purple-500')
                            : (darkMode ? 'bg-blue-600' : 'bg-blue-500')
                        }`}>
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className={`px-2 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap text-sm">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className={`px-2 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap text-sm ${
                      darkMode ? 'text-slate-300' : 'text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {new Date(user.created_at).toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-2.5 sm:py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          }`}
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.user_id)}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
  )
}