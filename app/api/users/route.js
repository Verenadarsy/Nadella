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

export async function GET(req) {
  // ➤ Cek query parameter untuk filter role
  const { searchParams } = new URL(req.url)
  const roleFilter = searchParams.get('role')

  const { data, error } = await getAll(table)

  if (error) {
    return new Response(JSON.stringify(error), { status: 500 })
  }

  // ➤ Filter hanya admin jika ada parameter role=admin
  if (roleFilter === 'admin') {
    const adminUsers = data.filter(user => user.role === 'admin')
    return new Response(JSON.stringify(adminUsers), { status: 200 })
  }

  return new Response(JSON.stringify(data), { status: 200 })
}

export async function POST(req) {
  try {
    const body = await req.json()

    let plainPassword = null
    let isPasswordGenerated = false

    // ➤ Cek apakah user request generate password
    if (body.generate_password) {
      plainPassword = generatePassword()
      isPasswordGenerated = true
    } else if (body.password_plain) {
      plainPassword = body.password_plain
      isPasswordGenerated = false
    } else {
      return new Response(JSON.stringify({
        error: "Password is required or enable generate_password"
      }), { status: 400 })
    }

    // ➤ Clean up field yang tidak ada di database
    delete body.generate_password
    delete body.password_plain

    // ➤ Hash password
    const hashed = await bcrypt.hash(plainPassword, 10)
    body.password_hash = hashed

    // ➤ Create user
    const { data, error } = await create(table, body)

    if (error) {
      console.error("Database error:", error)
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return new Response(JSON.stringify({
          error: "Email already exists. Please use a different email address."
        }), { status: 409 })
      }
      return new Response(JSON.stringify({ error: "Failed to create user" }), { status: 500 })
    }

    // ➤ AUTO CREATE CUSTOMER jika role = client
    if (body.role === "client") {
      const { data: customerData, error: customerErr } = await create("customers", {
        user_id: data.user_id,
        name: body.name,
        email: body.email,
        status: "customer" // optional biar rapi
      });

      if (customerErr) console.error("AUTO CUSTOMER ERROR:", customerErr);
    }


    // ➤ Kirim password via email
    try {
      await sendEmailToClient(body.email, plainPassword, body.name)
      console.log("Email sent to:", body.email)
    } catch (emailError) {
      console.error("⚠️ Email failed but user created:", emailError)
    }

    // ➤ Response
    return new Response(JSON.stringify({
      ...data,
      generated_password: isPasswordGenerated
    }), { status: 201 })

  } catch (err) {
    console.error("POST /api/users error:", err)
    return new Response(JSON.stringify({
      error: err.message || "Internal server error"
    }), { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const body = await req.json()

    let plainPassword = null
    let isPasswordGenerated = false

    // ➤ Handle password update
    if (body.generate_password) {
      plainPassword = generatePassword()
      isPasswordGenerated = true
    } else if (body.password_plain) {
      plainPassword = body.password_plain
      isPasswordGenerated = false
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

      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return new Response(JSON.stringify({
          error: "Email already exists. Please use a different email address."
        }), { status: 409 })
      }

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
    const response = isPasswordGenerated
      ? { ...data, generated_password: true }
      : { ...data, generated_password: false }

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