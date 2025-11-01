import { supabase } from "@/lib/supabaseClient";

export async function uploadToStorage(buffer, filename) {
  const bucket = "pdf-reports"; // pastikan sudah ada di Supabase Storage

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filename);

  return publicUrlData.publicUrl;
}
