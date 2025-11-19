import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export async function POST(req) {
  try {
    // Ambil data dari body request
    const body = await req.json();
    const { type } = body;

    if (!type) {
      return NextResponse.json({ error: "Type required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // KEYWORD REKAP
    const keywordsRekap = [
      "rekap semua",
      "laporan keseluruhan",
      "pdf rekap semua",
      "rekap keseluruhan",
      "full rekap",
      "export semua",
      "full dump",
      "export keseluruhan",
    ];

    const typeMsg = String(type).toLowerCase();
    const isRekap = keywordsRekap.some((k) => typeMsg.includes(k));

    // =======================================
    // 1️⃣ MODE REKAP SELURUH TABEL
    // =======================================
    if (isRekap) {
      console.log("⚡ Membuat PDF rekap keseluruhan (Landscape)...");

      // Ambil list tabel
      let { data: tables } = await supabase.rpc("list_tables");

      // Normalize list
      if (!Array.isArray(tables)) {
        tables = Object.values(tables ?? {});
      }

      // Filter tabel yang tidak perlu
      tables = tables
        .map((t) => String(t).trim())
        .filter(
          (t) =>
            t &&
            !["users", "profiles", "queries_preset", "migrations"].includes(t)
        );

      // ✅ SETTING 1: Landscape Orientation
      const doc = new jsPDF({ orientation: "landscape" });
      
      const tanggal = format(new Date(), "d MMMM yyyy, HH.mm", {
        locale: idLocale,
      });

      // Header Dokumen
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Laporan Rekap Keseluruhan`, 14, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Dibuat pada: ${tanggal}`, 14, 22);
      doc.line(14, 25, 280, 25); // Garis panjang (280mm krn landscape)

      let currentY = 35;

      for (const table of tables) {
        // Fetch data
        const { data: rows, error } = await supabase.from(table).select("*");

        // Judul Tabel
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Tabel: ${table}`, 14, currentY);
        currentY += 5;

        if (error || !rows || rows.length === 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.text(
            error ? `Error: ${error.message}` : "(Tidak ada data)",
            14,
            currentY
          );
          currentY += 10;
          continue;
        }

        // ✅ SETTING 2: Smart Column Logic
        const headers = Object.keys(rows[0]);
        const dynamicColumnStyles = {};

        headers.forEach((header, index) => {
          const h = header.toLowerCase();
          // Jika kolom ID (biasanya UUID panjang), paksa sempit
          if (h.includes("id") || h === "uuid") {
            dynamicColumnStyles[index] = { cellWidth: 22 }; 
          }
          // Jika kolom tanggal, atur sedang
          else if (h.includes("created_at") || h.includes("date")) {
             dynamicColumnStyles[index] = { cellWidth: 28 };
          }
        });

        // Render Table
        autoTable(doc, {
          startY: currentY,
          head: [headers],
          body: rows.map((row) => Object.values(row)),
          theme: "grid", // Pakai garis kotak
          styles: {
            fontSize: 8, // Font kecil
            cellPadding: 2,
            valign: "middle",
            overflow: "linebreak", // Text wrapping (turun ke bawah)
          },
          headStyles: {
            fillColor: [41, 128, 185], // Biru Header
            halign: "center",
          },
          columnStyles: dynamicColumnStyles, // Terapkan logika lebar kolom
        });

        currentY = doc.lastAutoTable.finalY + 10;
        
        // Cek page break manual jika perlu (biasanya autotable otomatis, tapi utk judul tabel perlu cek)
        if (currentY > 180) {
            doc.addPage();
            currentY = 20;
        }
      }

      // Upload PDF
      const pdfBytes = doc.output("arraybuffer");
      const fileName = `rekap-keseluruhan-${Date.now()}.pdf`;

      await supabase.storage
        .from("pdf-reports")
        .upload(fileName, pdfBytes, { contentType: "application/pdf" });

      const { data: publicUrl } = supabase.storage
        .from("pdf-reports")
        .getPublicUrl(fileName);

      return NextResponse.json({ url: publicUrl.publicUrl });
    }

    // =======================================
    // 2️⃣ MODE PRESET
    // =======================================
    const { data: preset } = await supabase
      .from("queries_preset")
      .select("query, description")
      .eq("intent", type)
      .single();

    if (!preset) {
      return NextResponse.json(
        { error: `Unknown type: ${type}` },
        { status: 404 }
      );
    }

    const cleanQuery = preset.query.trim().replace(/;$/, "");
    const { data: result } = await supabase.rpc("exec_sql", {
      sql: cleanQuery,
    });

    // ✅ Pake Landscape juga biar konsisten
    const doc = new jsPDF({ orientation: "landscape" });
    
    const tanggal = format(new Date(), "d MMMM yyyy, HH.mm", {
      locale: idLocale,
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Laporan: ${preset.description}`, 14, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Dibuat pada: ${tanggal}`, 14, 22);
    doc.line(14, 25, 280, 25);

    if (Array.isArray(result) && result.length > 0) {
      const headers = Object.keys(result[0]);
      
      // Logic yang sama untuk preset
      const dynamicColumnStyles = {};
      headers.forEach((header, index) => {
          const h = header.toLowerCase();
          if (h.includes("id") || h === "uuid") {
            dynamicColumnStyles[index] = { cellWidth: 25 }; 
          }
      });

      autoTable(doc, {
        startY: 35,
        head: [headers],
        body: result.map((row) => Object.values(row)),
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: { fillColor: [52, 73, 94] },
        columnStyles: dynamicColumnStyles
      });
    } else {
      doc.text("Tidak ada data ditemukan.", 14, 35);
    }

    const pdfBytes = doc.output("arraybuffer");
    const fileName = `laporan-${type}-${Date.now()}.pdf`;

    await supabase.storage
      .from("pdf-reports")
      .upload(fileName, pdfBytes, { contentType: "application/pdf" });

    const { data: publicUrl } = supabase.storage
      .from("pdf-reports")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl.publicUrl });

  } catch (err) {
    console.error("❌ Error generate PDF:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}