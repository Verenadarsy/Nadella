import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("tickets")
    .select("status");

  if (error) return Response.json({ error }, { status: 500 });

  const result = {};
  data.forEach((t) => {
    result[t.status] = (result[t.status] || 0) + 1;
  });

  return Response.json(
    Object.entries(result).map(([status, count]) => ({
      status,
      count,
    }))
  );
}
