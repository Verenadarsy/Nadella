import { getAll, create, update, remove } from "@/lib/crudHelper"
import bcrypt from "bcryptjs"
import { sendEmailToClient } from "@/lib/mailer"

const table = "users"
const idField = "user_id"

function generatePassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let pass = ""
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

export async function GET() {
  const { data, error } = await getAll(table)
  return new Response(JSON.stringify(error ?? data), { status: error ? 500 : 200 })
}

export async function POST(req) {
  try {
    const body = await req.json()

    let plainPassword = null
    
    // ➤ Cek apakah user request generate password
    if (body.generate_password) {
      plainPassword = generatePassword()
    } else if (body.password_plain) {
      plainPassword = body.password_plain
    } else {
      return new Response(JSON.stringify({ 
        error: "Password is required or enable generate_password" 
      }), { status: 400 })
    }

    // ➤ Clean up - hapus field yang ga ada di database
    delete body.generate_password
    delete body.password_plain

    // ➤ Hash password untuk database
    const hashed = await bcrypt.hash(plainPassword, 10)
    body.password_hash = hashed

    const { data, error } = await create(table, body)
    
    if (error) {
      console.error("Database error:", error)
      return new Response(JSON.stringify({ error: "Failed to create user" }), { 
        status: 500 
      })
    }

    // ➤ Kirim password ke email client (optional, jangan sampai break proses)
    try {
      await sendEmailToClient(body.email, plainPassword, body.name)
      console.log("✅ Email sent to:", body.email)
    } catch (emailError) {
      console.error("⚠️ Email failed but user created:", emailError)
      // Tidak return error, user tetap berhasil dibuat
    }

    // ➤ Return data dengan generated password
    return new Response(JSON.stringify({ 
      ...data, 
      generated_password: plainPassword 
    }), {
      status: 201
    })

  } catch (err) {
    console.error("POST /api/users error:", err)
    return new Response(JSON.stringify({ 
      error: err.message || "Internal server error" 
    }), { 
      status: 500 
    })
  }
}

export async function PUT(req) {
  try {
    const body = await req.json()

    let plainPassword = null

    // ➤ Handle password update
    if (body.generate_password) {
      plainPassword = generatePassword()
    } else if (body.password_plain) {
      plainPassword = body.password_plain
    }

    // ➤ Clean up dan hash password jika ada
    delete body.generate_password
    delete body.password_plain
    
    if (plainPassword) {
      const hashed = await bcrypt.hash(plainPassword, 10)
      body.password_hash = hashed
    }

    const { data, error } = await update(table, idField, body)
    
    if (error) {
      console.error("Database error:", error)
      return new Response(JSON.stringify({ error: "Failed to update user" }), { 
        status: 500 
      })
    }

    // ➤ Kirim email jika ada password baru
    if (plainPassword) {
      try {
        await sendEmailToClient(body.email, plainPassword, body.name)
        console.log("✅ Password update email sent to:", body.email)
      } catch (emailError) {
        console.error("⚠️ Email failed but user updated:", emailError)
      }
    }

    // ➤ Return dengan generated password jika ada
    const response = plainPassword 
      ? { ...data, generated_password: plainPassword }
      : data

    return new Response(JSON.stringify(response), { status: 200 })

  } catch (err) {
    console.error("PUT /api/users error:", err)
    return new Response(JSON.stringify({ 
      error: err.message || "Internal server error" 
    }), { 
      status: 500 
    })
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json()
    const { error } = await remove(table, idField, id)
    
    if (error) {
      console.error("Database error:", error)
      return new Response(JSON.stringify({ error: "Failed to delete user" }), { 
        status: 500 
      })
    }

    return new Response(JSON.stringify({ message: "Deleted" }), { status: 200 })

  } catch (err) {
    console.error("DELETE /api/users error:", err)
    return new Response(JSON.stringify({ 
      error: err.message || "Internal server error" 
    }), { 
      status: 500 
    })
  }
}