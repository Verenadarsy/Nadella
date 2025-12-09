import { supabase } from '@/lib/supabaseClient'
import bcrypt from 'bcryptjs'
import { sendEmailToClient } from '@/lib/mailer'

// Helper: Generate random password
function generatePassword(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let pass = ""
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

// POST: Generate user for customer after email input
export async function POST(req) {
  try {
    const { customer_id, email } = await req.json()

    if (!customer_id || !email) {
      return new Response(
        JSON.stringify({ error: 'customer_id and email are required' }),
        { status: 400 }
      )
    }

    console.log('🚀 Generating user for customer:', customer_id)

    // Fetch customer
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_id', customer_id)
      .single()

    if (fetchError || !customer) {
      return new Response(
        JSON.stringify({ error: 'Customer not found' }),
        { status: 404 }
      )
    }

    // Check if user already exists
    if (customer.user_id) {
      return new Response(
        JSON.stringify({ error: 'User already exists for this customer' }),
        { status: 400 }
      )
    }

    // Generate password
    const plainPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    // Create USER
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        name: customer.name,
        email: email,
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

    // Update CUSTOMER with email and user_id
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        email: email,
        user_id: newUser.user_id
      })
      .eq('customer_id', customer_id)

    if (updateError) {
      console.error('❌ Failed to update customer:', updateError)

      // Rollback: Delete user
      await supabase.from('users').delete().eq('user_id', newUser.user_id)

      return new Response(
        JSON.stringify({ error: 'Failed to update customer', details: updateError.message }),
        { status: 500 }
      )
    }

    console.log('✅ Customer updated with email and user_id')

    // Send email with credentials
    try {
      await sendEmailToClient(email, plainPassword, customer.name)
      console.log('✅ Email sent to:', email)
    } catch (emailError) {
      console.error('⚠️ Email failed but user created:', emailError)
      // Don't fail - user already created successfully
    }

    console.log('🎉 User generation complete!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User generated successfully',
        user_id: newUser.user_id,
        email: email
      }),
      { status: 200 }
    )

  } catch (err) {
    console.error('POST /api/customers/generate-user error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500 }
    )
  }
}