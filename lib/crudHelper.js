import { supabase } from "@/lib/supabaseClient"

export async function getAll(table) {
  return supabase.from(table).select("*")
}

export async function create(table, body) {
  return supabase.from(table).insert(body).select()
}

export async function update(table, idField, body) {
  const id = body[idField]
  return supabase.from(table).update(body).eq(idField, id).select()
}

export async function remove(table, idField, id) {
  return supabase.from(table).delete().eq(idField, id)
}
