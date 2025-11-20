import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("activities")
    .select("type");

  if (error) return Response.json({ error }, { status: 500 });

  const result = {};
  data.forEach((a) => {
    result[a.type] = (result[a.type] || 0) + 1;
  });

  return Response.json(
    Object.entries(result).map(([type, count]) => ({
      type,
      count,
    }))
  );
}
