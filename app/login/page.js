'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import bcrypt from 'bcryptjs'
import Swal from 'sweetalert2'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // ⛔ muncul popup kalau datang dari halaman yang butuh login
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('auth') === 'required') {
      Swal.fire({
        icon: 'warning',
        title: 'Access Denied',
        text: 'You must login first!',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#3085d6',
        background: '#f9f9f9',
      })
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

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

    const match = bcrypt.compareSync(password, user.password_hash)
    if (!match) {
      Swal.fire({
        icon: 'error',
        title: 'Password salah',
        text: 'Silakan coba lagi.',
      })
      return
    }

    document.cookie = `userRole=${user.role}; path=/`

    await Swal.fire({
      icon: 'success',
      title: 'Login Berhasil!',
      text: `Selamat datang, ${user.name}`,
      showConfirmButton: false,
      timer: 1500,
    })

    if (user.role === 'superadmin') {
      window.location.href = '/dashboard/superadmin'
    } else if (user.role === 'admin') {
      window.location.href = '/dashboard/admin'
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Role tidak dikenali',
        text: 'Hubungi admin sistem.',
      })
    }
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
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
