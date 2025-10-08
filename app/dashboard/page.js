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
        <button
          onClick={() => goTo('products')}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '1rem',
          }}
        >
          Manage Products
        </button>

        {/* TOMBOL INI HANYA MUNCUL UNTUK SUPERADMIN */}
        {role === 'superadmin' && (
          <button
            onClick={() => goTo('manage-admins')}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '1rem',
            }}
          >
            Manage Admins
          </button>
        )}

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
