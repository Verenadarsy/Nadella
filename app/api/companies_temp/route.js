import { getAll, create, update, remove } from "@/lib/crudHelper"

const table = "companies"
const idField = "company_id"

export async function GET() {
  const { data, error } = await getAll(table)
  if (error) console.error("❌ GET error:", error)
  return new Response(JSON.stringify(error ?? data), { status: error ? 500 : 200 })
}

export async function POST(req) {
  try {
    const body = await req.json()
    console.log("📦 POST body:", body)
    const { data, error } = await create(table, body)
    if (error) {
      console.error("❌ POST error:", error)
      return new Response(JSON.stringify(error), { status: 500 })
    }
    return new Response(JSON.stringify(data), { status: 201 })
  } catch (err) {
    console.error("💥 Unexpected error:", err)
    return new Response(JSON.stringify({ message: "Internal Server Error", detail: err.message }), { status: 500 })
  }
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
