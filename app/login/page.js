// file: app/login/page.js (atau path login-mu saat ini)
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import bcrypt from 'bcryptjs'
import Swal from 'sweetalert2'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('auth') === 'required') {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'You must login first!',
        confirmButtonText: 'Okay',
      })
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()

    // ambil user dari tabel users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      Swal.fire({
        icon: 'error',
        title: 'User tidak ditemukan',
        text: 'Periksa kembali email kamu!',
      })
      return
    }

    // cek password hash (bcrypt)
    const match = bcrypt.compareSync(password, user.password_hash)
    if (!match) {
      Swal.fire({
        icon: 'error',
        title: 'Password salah',
        text: 'Silakan coba lagi.',
      })
      return
    }

    // simpan cookies (encode email agar karakter aman)
    document.cookie = `userRole=${user.role}; path=/`
    document.cookie = `userEmail=${encodeURIComponent(user.email)}; path=/`

    await Swal.fire({
      icon: 'success',
      title: 'Login Berhasil!',
      text: `Selamat datang, ${user.name}`,
      showConfirmButton: false,
      timer: 1200,
    })

    // redirect ke unified dashboard
    router.push('/dashboard')
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '5rem' }}>
      <h1>Login Page</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}
