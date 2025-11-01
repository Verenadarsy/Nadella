import { jsPDF } from "jspdf";
import { supabase } from "./db.js";

export async function triggerPDF(type) {
  try {
    // 1️⃣ Ambil query preset sesuai intent/type
    const { data: preset, error } = await supabase
      .from("queries_preset")
      .select("query, description")
      .eq("intent", type)
      .single();

    if (error || !preset) throw new Error(`Intent tidak ditemukan.`);

    // 2️⃣ Eksekusi query preset
    const { data: result, error: queryError } = await supabase.rpc("exec_sql", {
      sql: preset.query,
    });
    if (queryError) throw queryError;

    // 3️⃣ Buat PDF
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Laporan ${preset.description}`, 10, 10);
    doc.setFontSize(10);

    if (Array.isArray(result) && result.length > 0) {
      result.forEach((row, i) => {
        const text = Object.entries(row)
          .map(([key, val]) => `${key}: ${val ?? "-"}`)
          .join(" | ");
        doc.text(`${i + 1}. ${text}`, 10, 20 + i * 8);
      });
    } else {
      doc.text("Tidak ada data ditemukan.", 10, 20);
    }

    // 4️⃣ Simpan ke Supabase Storage
    const pdfBytes = doc.output("arraybuffer");
    const fileName = `${type}-${Date.now()}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("pdf-reports")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
      });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from("pdf-reports")
      .getPublicUrl(fileName);

    return { url: publicUrl.publicUrl };
  } catch (err) {
    console.error("❌ Error generate PDF:", err.message);
    throw err;
  }
}
