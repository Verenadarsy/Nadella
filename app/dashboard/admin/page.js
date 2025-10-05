'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

export default function AdminDashboard() {
  const router = useRouter()

  useEffect(() => {
    const roleCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('userRole='))
      ?.split('=')[1]

    // kalau belum login
    if (!roleCookie) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'Kamu harus login dulu!',
      }).then(() => {
        router.push('/login?auth=required')
      })
      return
    }

    // kalau role-nya bukan admin
    if (roleCookie !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Akses ditolak!',
        text: 'Halaman ini hanya untuk Admin.',
      }).then(() => {
        router.push(`/dashboard/${roleCookie}`)
      })
      return
    }
  }, [router])

  const handleLogout = () => {
    document.cookie = 'userRole=; Max-Age=0; path=/;'
    document.cookie = 'userEmail=; Max-Age=0; path=/;'
    localStorage.clear()
    Swal.fire({
      icon: 'success',
      title: 'Logout berhasil!',
      text: 'Sampai jumpa lagi 👋',
    }).then(() => {
      router.push('/login')
    })
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '5rem' }}>
      <h1>Admin Dashboard</h1>
      <p>Selamat datang di halaman Admin!</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
