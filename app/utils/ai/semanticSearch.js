import { supabase } from "@/lib/supabaseClient";

export async function semanticSearch(
  queryEmbedding,
  matchCount = 5,
  filters = {}
) {
  const { data, error } = await supabase.rpc(
    "match_ai_embeddings_v2",
    {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter_status: filters.status ?? null,
      filter_date: filters.date ?? null
    }
  );

  if (error) throw error;
  return data;
}
