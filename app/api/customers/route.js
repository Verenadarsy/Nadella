import { supabase } from "@/lib/supabaseClient"
import { create, update, remove } from "@/lib/crudHelper"

const table = "customers"
const idField = "customer_id"

export async function GET() {
  try {
    // ➤ Query dengan JOIN untuk mendapatkan pic_name dari users
    const { data, error } = await supabase
      .from(table)
      .select(`
        *,
        pic_name:users!pic_id(name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("GET /api/customers error:", error)
      return new Response(JSON.stringify({ error: "Failed to fetch customers" }), {
        status: 500
      })
    }

    // ➤ Transform data agar pic_name langsung di root level
    const transformedData = data.map(customer => ({
      ...customer,
      pic_name: customer.pic_name?.name || null
    }))

    return new Response(JSON.stringify(transformedData), { status: 200 })
  } catch (error) {
    console.error("GET /api/customers error:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch customers" }), {
      status: 500
    })
  }
}

export async function POST(req) {
  const body = await req.json()
  const { data, error } = await create(table, body)
  return new Response(JSON.stringify(error ?? data), { status: error ? 500 : 201 })
}

export async function PUT(req) {
  const body = await req.json()
  const { data, error } = await update(table, idField, body)
  return new Response(JSON.stringify(error ?? data), { status: error ? 500 : 200 })
}

export async function DELETE(req) {
  const { id } = await req.json()
  const { error } = await remove(table, idField, id)
  return new Response(JSON.stringify(error ?? { message: "Deleted" }), { status: error ? 500 : 200 })
}