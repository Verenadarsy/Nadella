import { getAll, create, update, remove } from "@/lib/crudHelper"
import bcrypt from "bcryptjs"

const table = "users"
const idField = "user_id"

export async function GET() {
  const { data, error } = await getAll(table)
  return new Response(JSON.stringify(error ?? data), { status: error ? 500 : 200 })
}

export async function POST(req) {
  const body = await req.json()

  if (body.password_plain) {
    const hashed = await bcrypt.hash(body.password_plain, 10)
    body.password_hash = hashed
    delete body.password_plain
  }

  const { data, error } = await create(table, body)
  return new Response(JSON.stringify(error ?? data), {
    status: error ? 500 : 201
  })
}

export async function PUT(req) {
  const body = await req.json()

  if (body.password_plain) {
    const hashed = await bcrypt.hash(body.password_plain, 10)
    body.password_hash = hashed
    delete body.password_plain
  }

  const { data, error } = await update(table, idField, body)
  return new Response(JSON.stringify(error ?? data), {
    status: error ? 500 : 200
  })
}

export async function DELETE(req) {
  const { id } = await req.json()
  const { error } = await remove(table, idField, id)
  return new Response(JSON.stringify(error ?? { message: "Deleted" }), {
    status: error ? 500 : 200
  })
}
