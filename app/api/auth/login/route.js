import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    console.log("=== DEBUG LOGIN ===");
    console.log("Email input:", email);
    console.log("User found:", user);
    console.log("Password plaintext:", password);
    console.log("Hash from DB:", user?.password_hash);
    console.log("Hash length:", user?.password_hash?.length);

    if (error || !user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("Compare result:", isMatch);

    if (!isMatch) {
      return new Response(JSON.stringify({ error: "Invalid password" }), { status: 401 });
    }

    return new Response(JSON.stringify({ success: true, message: "Password correct!" }), {
      status: 200
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error", detail: err.message }), {
      status: 500
    });
  }
}
