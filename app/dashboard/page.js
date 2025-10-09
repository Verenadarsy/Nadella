'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

export default function Dashboard() {
  const router = useRouter()
  const [role, setRole] = useState(null)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const roleCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('userRole='))
      ?.split('=')[1]

    const emailCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('userEmail='))
      ?.split('=')[1]

    if (!roleCookie) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Kamu harus login dulu!',
      }).then(() => router.push('/login'))
      return
    }

    setRole(roleCookie)
    setEmail(emailCookie)
  }, [router])

  const handleLogout = () => {
    document.cookie = 'userRole=; Max-Age=0; path=/;'
    document.cookie = 'userEmail=; Max-Age=0; path=/;'
    localStorage.clear()
    Swal.fire({
      icon: 'success',
      title: 'Logout berhasil!',
      text: 'Sampai jumpa lagi 👋',
    }).then(() => router.push('/login'))
  }

  const goTo = (path) => router.push(`/dashboard/${path}`)

  return (
    <div style={{ textAlign: 'center', marginTop: '5rem' }}>
      <h1>Dashboard {role === 'superadmin' ? 'Super Admin' : 'Admin'}</h1>
      <p>Selamat datang, {email || 'User'}!</p>

      <div style={{ marginTop: '2rem' }}>
        {/* ✅ PRODUCTS */}
        <button
          onClick={() => goTo('products')}
          style={buttonStyle('#007bff')}
        >
          Manage Products
        </button>

        {/* ✅ COMPANIES */}
        <button
          onClick={() => goTo('companies')}
          style={buttonStyle('#6f42c1')}
        >
          Manage Companies
        </button>

        {/* ✅ CUSTOMERS */}
        <button
          onClick={() => goTo('customers')}
          style={buttonStyle('#17a2b8')}
        >
          Manage Customers
        </button>

        {/* ✅ LEADS */}
        <button
          onClick={() => goTo('leads')}
          style={buttonStyle('#ffc107')}
        >
          Manage Leads
        </button>

        {/* ✅ HANYA SUPERADMIN */}
        {role === 'superadmin' && (
          <button
            onClick={() => goTo('manage-admins')}
            style={buttonStyle('#28a745')}
          >
            Manage Admins
          </button>
        )}

        {/* ✅ LOGOUT */}
        <button
          onClick={handleLogout}
          style={buttonStyle('#dc3545')}
        >
          Logout
        </button>
      </div>
    </div>
  )
}

function buttonStyle(color) {
  return {
    backgroundColor: color,
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '1rem',
  }
}
