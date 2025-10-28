// app/api/generate-pdf/route.js
export const runtime = "nodejs";

import PDFDocument from "pdfkit";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

async function generatePDF() {
  // 🔹 Koneksi ke Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // 🔹 Ambil data customer aktif
  const { data, error } = await supabase
    .from("customers")
    .select("name, email, status")
    .eq("status", "customer");

  if (error) throw error;

  // 🔹 Buat dokumen PDF baru
  const doc = new PDFDocument({ margin: 40 });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const endPromise = new Promise((resolve) => doc.on("end", resolve));

  // 🔹 Header dokumen
  doc.font("Times-Roman");
  doc.fontSize(18).text("📋 Rekapitulasi Pelanggan Aktif", { align: "center" });
  doc.moveDown();

  // 🔹 Isi data
  if (!data || data.length === 0) {
    doc.fontSize(12).text("Tidak ada data pelanggan aktif.", { align: "center" });
  } else {
    data.forEach((c, i) => {
      doc.fontSize(12).text(`${i + 1}. ${c.name} - ${c.email} (${c.status})`);
    });
  }

  // 🔹 Selesai
  doc.end();
  await endPromise;
  const pdfBuffer = Buffer.concat(chunks);
  return pdfBuffer;
}

// ✅ Support GET + POST supaya bisa diklik browser atau dipanggil via fetch
export async function GET() {
  try {
    const pdfBuffer = await generatePDF();
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="rekap_pelanggan.pdf"',
      },
    });
  } catch (err) {
    console.error("PDF Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
