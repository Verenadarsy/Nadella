import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("customers")
    .select("created_at");

  if (error) return Response.json({ error }, { status: 500 });

  // grouping manual (karena supabase-js no raw SQL)
  const groups = {};

  data.forEach((row) => {
    const month = row.created_at.slice(0, 7); // "YYYY-MM"
    groups[month] = (groups[month] || 0) + 1;
  });

  const results = Object.entries(groups).map(([month, count]) => ({
    month,
    count,
  }));

  return Response.json(results);
}
