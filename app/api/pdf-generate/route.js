import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";

export async function POST(req) {
  try {
    const { type } = await req.json();
    if (!type) return NextResponse.json({ error: "Type required" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Ambil query dari queries_preset berdasarkan intent/type
    const { data: preset, error } = await supabase
      .from("queries_preset")
      .select("query, description")
      .eq("intent", type)
      .single();

    if (error || !preset) {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 404 });
    }

    // Jalankan query-nya pakai function exec_sql
    const cleanQuery = preset.query.trim().replace(/;$/, "");

    const { data: result, error: queryError } = await supabase.rpc("exec_sql", {
    sql: cleanQuery,
    });


    if (queryError) throw queryError;

    // Buat PDF-nya
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Laporan ${preset.description}`, 10, 10);
    doc.setFontSize(10);

    if (Array.isArray(result) && result.length > 0) {
      result.forEach((row, i) => {
        const text = Object.values(row)
          .map(v => (v ?? "-").toString())
          .join(" | ");
        doc.text(`${i + 1}. ${text}`, 10, 20 + i * 8);
      });
    } else {
      doc.text("Tidak ada data ditemukan.", 10, 20);
    }

    const pdfBytes = doc.output("arraybuffer");
    const fileName = `${type}-${Date.now()}.pdf`;

    // Upload ke Supabase Storage (folder "pdf-reports")
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("pdf-reports")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
      });

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from("pdf-reports")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl.publicUrl });
  } catch (err) {
    console.error("❌ Error generate PDF:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
