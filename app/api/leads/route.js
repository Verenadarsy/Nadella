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

// PUT: Update lead
export async function PUT(req) {
  try {
    const body = await req.json()
    const { lead_id, lead_name, lead_status, customer_id } = body

    // Fetch existing lead
    const { data: existingLead, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq(idField, lead_id)
      .single()

    if (fetchError || !existingLead) {
      return new Response(JSON.stringify({ error: 'Lead not found' }), { status: 404 })
    }

    let updatedCustomerId = customer_id
    let needEmailInput = false

    // ========================================
    // STEP 1: AUTO-GENERATE CUSTOMER (WITHOUT USER)
    // ========================================
    if (
      lead_status === 'qualified' &&
      existingLead.lead_status !== 'qualified' &&
      !existingLead.customer_id
    ) {
      console.log('🚀 Auto-generating Customer for qualified lead...')

      // Create CUSTOMER (tanpa user_id, email masih NULL)
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: lead_name,
          email: null,        // Email belum ada
          user_id: null,      // User belum dibuat
          phone: null,
          address: null
        })
        .select()
        .single()

      if (customerError) {
        console.error('❌ Failed to create customer:', customerError)
        return new Response(
          JSON.stringify({ error: 'Failed to create customer', details: customerError.message }),
          { status: 500 }
        )
      }

      console.log('✅ Customer created:', newCustomer.customer_id)
      updatedCustomerId = newCustomer.customer_id
      needEmailInput = true

      console.log('⏳ Waiting for email input to generate user...')
    }

    // Update lead
    const updatedBody = {
      ...body,
      customer_id: updatedCustomerId
    }

    const { data, error } = await update(table, idField, updatedBody)

    if (error) {
      return new Response(JSON.stringify(error), { status: 500 })
    }

    // ========================================
    // PERBAIKAN: Return customer_id yang baru dibuat!
    // ========================================
    if (needEmailInput) {
      return new Response(
        JSON.stringify({
          success: true,
          needEmailInput: true,
          customer_id: updatedCustomerId,  // ← INI YANG PENTING!
          message: 'Customer created, please provide email'
        }),
        { status: 200 }
      )
    }

    // Normal update response
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