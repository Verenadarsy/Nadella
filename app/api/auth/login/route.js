import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (!user || error) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const match = bcrypt.compareSync(password, user.password_hash)
    if (!match) {
      return NextResponse.json({ message: 'Incorrect password' }, { status: 401 })
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || '7d' }
    )

    const response = NextResponse.json({ 
      message: 'Login successful',
      role: user.role,
      name: user.name 
    }, { status: 200 })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 hari
    })

    response.cookies.set('userRole', user.role, { path: '/' })
    response.cookies.set('userEmail', user.email, { path: '/' })

    return response

  } catch (err) {
    console.error("LOGIN ERROR:", err)
    return NextResponse.json(
      { message: 'Internal Server Error', error: err.message },
      { status: 500 }
    )
  }
}
