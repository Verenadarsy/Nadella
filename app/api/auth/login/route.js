import { supabase } from "@/lib/supabaseClient";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export async function POST(req) {
  const body = await req.json();
  const { email, password } = body;

  // cek user di tabel users
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !users) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 401 });
  }

  // compare password (plaintext)
  if (users.password_hash !== password) {
    return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 });
  }

  // generate token
  const token = jwt.sign(
    { user_id: users.user_id, role: users.role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return new Response(
    JSON.stringify({ token, role: users.role }),
    { status: 200 }
  );
}
