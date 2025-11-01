import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export async function POST(req) {
  try {
    const { type } = await req.json();
    if (!type)
      return NextResponse.json({ error: "Type required" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Ambil query preset dari DB
    const { data: preset, error } = await supabase
      .from("queries_preset")
      .select("query, description")
      .eq("intent", type)
      .single();

    if (error || !preset)
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 404 });

    // Jalankan query-nya
    const cleanQuery = preset.query.trim().replace(/;$/, "");
    const { data: result, error: queryError } = await supabase.rpc("exec_sql", {
      sql: cleanQuery,
    });
    if (queryError) throw queryError;

    // --- PDF Setup ---
    const doc = new jsPDF();
    const tanggal = format(new Date(), "d/M/yyyy, HH.mm.ss", { locale: idLocale });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Laporan: ${preset.description}`, 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Dibuat pada: ${tanggal}`, 20, 28);

    doc.line(20, 31, 190, 31); // garis bawah header

    // --- Isi Tabel ---
    if (Array.isArray(result) && result.length > 0) {
      const headers = Object.keys(result[0]);
      const rows = result.map((row) => Object.values(row));

      autoTable(doc, {
        startY: 40,
        head: [headers],
        body: rows,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [60, 141, 188], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
    } else {
      doc.text("Tidak ada data ditemukan.", 20, 45);
    }

    // Upload ke Supabase Storage
    const pdfBytes = doc.output("arraybuffer");
    const fileName = `laporan-${type}-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
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
