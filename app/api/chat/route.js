import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// 🧠 Fungsi bantu: matching intent dari tabel queries_preset
function matchIntent(message, intents) {
  const msg = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const intent of intents) {
    const kwList = intent.keywords?.split(",").map(k => k.trim()) || [];
    let score = 0;

    kwList.forEach(k => {
      if (msg.includes(k)) score += 1;
    });
    if (msg.includes(intent.intent)) score += 2;
    if (msg.includes(intent.description.split(" ")[1]?.toLowerCase())) score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }
  return bestMatch;
}

// Trigger PDF
async function triggerPDF(type = "barang", payload = null) {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${baseURL}/api/pdf-generate`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ PDF generation failed:", text);
    throw new Error("Gagal membuat PDF");
  }

  return (await res.json())?.url || null;
}

// 💬 Endpoint utama Chat
export async function POST(req) {
  try {
    const { message } = await req.json();
    if (!message)
      return NextResponse.json({ error: "Message required" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const lowerMsg = message.toLowerCase();

    // ======================================================
    // 1️⃣ DETEKSI REKAP SEMUA (PENTING! DITARUH PALING ATAS)
    // ======================================================
    const rekapKeywords = [
      "rekap semua",
      "rekap keseluruhan",
      "laporan keseluruhan",
      "full rekap",
      "full dump",
      "export semua",
      "export keseluruhan",
      "pdf rekap semua"
    ];

    const isRekapSemua = rekapKeywords.some(k => lowerMsg.includes(k));

    if (isRekapSemua) {
      let reply = "📊 Membuat laporan **rekap semua tabel**...";
      try {
        const pdfUrl = await triggerPDF(rekapKeywords); // FIX → pakai tipe jelas & satu kata

        reply += `\n\n📄 **Berhasil dibuat!**`;
        reply += `\n👉 Unduh: ${pdfUrl}`;
      } catch (e) {
        reply += `\n\n⚠️ Gagal membuat PDF.`;
      }
      return NextResponse.json({ reply });
    }

    // =============================================
    // 2️⃣ MATCHING PRESET (HANYA DIJALANKAN JIKA BUKAN REKAP SEMUA)
    // =============================================
    const { data: intents } = await supabase
      .from("queries_preset")
      .select("*");

    const matched = matchIntent(lowerMsg, intents);

    if (matched) {
      let reply = "";
      const cleanQuery = matched.query.trim().replace(/;$/, "");

      const { data: result, error: queryErr } = await supabase.rpc("exec_sql", {
        sql: cleanQuery,
      });

      if (queryErr) {
        return NextResponse.json({
          reply: "⚠️ Terjadi kesalahan saat menjalankan query preset.",
        });
      }

      const rows = Array.isArray(result) ? result : [result];

      reply = `🧾 Menampilkan ${matched.description}:\n`;

      if (rows.length > 0) {
        reply += rows
          .map((row, i) => {
            // Buang kolom yang tidak ingin ditampilkan
            const filtered = Object.fromEntries(
              Object.entries(row).filter(
                ([key]) =>
                  !["id", "customer_id", "campaign_id", "lead_id","deal_id","service_id","activity_id","team_id","company_id","communication_id","ticket_id","product_id","created_at", "updated_at", "deleted_at"].includes(key)
              )
            );

            // Convert ke string rapi
            const values = Object.values(filtered)
              .map(v => (v !== null ? v.toString() : "-"))
              .join(" — ");

            return `${i + 1}) ${values}`;
          })
          .join("\n");
      } else {
        reply += "\n(Tidak ada data)";
      }

      // Jika user bilang "buat PDF"
      const wantsPDF =
        lowerMsg.includes("rekap") ||
        lowerMsg.includes("pdf") ||
        lowerMsg.includes("laporan");

      if (wantsPDF) {
        try {
          const pdfUrl = await triggerPDF(matched.intent, rows);
          reply = `📄 Laporan PDF untuk "${matched.description}" berhasil dibuat!\n👉 Unduh: ${pdfUrl}`;
        } catch (err) {
          reply = `⚠️ Gagal membuat laporan PDF untuk "${matched.description}".`;
        }
      }

      return NextResponse.json({ reply });
    }

    // ======================================================
    // 3️⃣ KALAU TIDAK ADA INTENT → LEMPAR KE GPT
    // ======================================================
    return NextResponse.json({
      reply: "Maaf, aku belum tahu maksud kamu 😅",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
