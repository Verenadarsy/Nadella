import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("deals")
    .select("deal_stage");

  if (error) return Response.json({ error }, { status: 500 });

  // Grouping manual by deal_stage
  const groups = {};

  data.forEach((row) => {
    const stage = row.deal_stage;
    if (stage) {
      groups[stage] = (groups[stage] || 0) + 1;
    }
  });

  const results = Object.entries(groups).map(([deal_stage, count]) => ({
    deal_stage,
    count,
  }));

  console.log('Deal Stage Results:', results);

  return Response.json(results);
}