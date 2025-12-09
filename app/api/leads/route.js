import { getAll, create, update, remove } from "@/lib/crudHelper"
import { supabase } from '@/lib/supabaseClient'
import bcrypt from 'bcryptjs'
import { sendEmailToClient } from '@/lib/mailer'

const table = "leads"
const idField = "lead_id"

// Helper: Generate random password
function generatePassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let pass = ""
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

// GET: Fetch all leads
export async function GET() {
  const { data, error } = await getAll(table)
  return new Response(JSON.stringify(error ?? data), { status: error ? 500 : 200 })
}

// POST: Create new lead
export async function POST(req) {
  const body = await req.json()
  const { data, error } = await create(table, body)
  return new Response(JSON.stringify(error ?? data), { status: error ? 500 : 201 })
}

// PUT: Update lead (with auto-generate user + customer on qualified)
export async function PUT(req) {
  try {
    const body = await req.json()
    const { lead_id, lead_name, lead_status, customer_id } = body

    // Fetch existing lead to compare status
    const { data: existingLead, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq(idField, lead_id)
      .single()

    if (fetchError || !existingLead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), { status: 404 })
    }

    let updatedCustomerId = customer_id

    // ========================================
    // AUTO-GENERATE USER + CUSTOMER ON QUALIFIED
    // ========================================
    if (
      lead_status === 'qualified' &&
      existingLead.lead_status !== 'qualified' &&
      !existingLead.customer_id
    ) {
      console.log('🚀 Auto-generating User + Customer for qualified lead...')

      // Step 1: Generate email from lead_name
      const emailName = lead_name
        .toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '')

      const generatedEmail = `${emailName}@nadella.client`
      const plainPassword = generatePassword()
      const hashedPassword = await bcrypt.hash(plainPassword, 10)

      // Step 2: Create USER
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          name: lead_name,
          email: generatedEmail,
          role: 'client',
          password_hash: hashedPassword
        })
        .select()
        .single()

      if (userError) {
        console.error('❌ Failed to create user:', userError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user', details: userError.message }),
          { status: 500 }
        )
      }

      console.log('✅ User created:', newUser.user_id)

      // Step 3: Create CUSTOMER (linked to user)
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: lead_name,
          email: generatedEmail,
          user_id: newUser.user_id,
          status: 'customer'
        })
        .select()
        .single()

      if (customerError) {
        console.error('❌ Failed to create customer:', customerError)

        // Rollback: Delete user if customer creation fails
        await supabase.from('users').delete().eq('user_id', newUser.user_id)

        return new Response(
          JSON.stringify({ error: 'Failed to create customer', details: customerError.message }),
          { status: 500 }
        )
      }

      console.log('✅ Customer created:', newCustomer.customer_id)

      // Update customer_id for lead update
      updatedCustomerId = newCustomer.customer_id

      // Step 4: Send email with credentials
      try {
        await sendEmailToClient(generatedEmail, plainPassword, lead_name)
        console.log('✅ Email sent to:', generatedEmail)
      } catch (emailError) {
        console.error('⚠️ Email failed but user/customer created:', emailError)
        // Don't fail the request, user/customer already created
      }

      console.log('🎉 Auto-generation complete!')
    }

    // Update lead with new data (including customer_id if generated)
    const updatedBody = {
      ...body,
      customer_id: updatedCustomerId
    }

    const { data, error } = await update(table, idField, updatedBody)

    if (error) {
      return new Response(JSON.stringify(error), { status: 500 })
    }

    return new Response(JSON.stringify(data), { status: 200 })

  } catch (err) {
    console.error('PUT /api/leads error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500 }
    )
  }
}

// DELETE: Delete lead
export async function DELETE(req) {
  const { id } = await req.json()
  const { error } = await remove(table, idField, id)
  return new Response(JSON.stringify(error ?? { message: "Deleted" }), { status: error ? 500 : 200 })
}