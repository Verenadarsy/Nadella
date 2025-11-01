import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// 🧠 Fungsi bantu buat matching intent dari tabel queries_preset
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

// 📦 Fungsi bantu untuk trigger pembuatan PDF
async function triggerPDF(type = "barang") {
  const baseURL =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${baseURL}/api/pdf-generate`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ PDF generation failed:", text);
    throw new Error("Gagal membuat PDF");
  }

  const data = await res.json();
  return data?.url || null;
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

    // 🧩 1️⃣ Ambil semua intent dari DB
    const { data: intents, error: intentError } = await supabase
      .from("queries_preset")
      .select("*");
    if (intentError) throw intentError;

    const matched = matchIntent(lowerMsg, intents);
    let replyText = "";

    // 🧩 2️⃣ Deteksi kalau user minta rekap / laporan
    const isRekap =
      lowerMsg.includes("rekap") ||
      lowerMsg.includes("laporan") ||
      lowerMsg.includes("pdf");

    // Jika rekap tapi tidak ada intent spesifik → buat rekap semua tabel
    if (isRekap && !matched) {
      replyText = "📊 Membuat laporan rekap semua tabel...";
      try {
        const pdfUrl = await triggerPDF("semua");
        replyText += `\n\n📄 Laporan rekap keseluruhan berhasil dibuat!`;
        if (pdfUrl) replyText += `\n👉 Unduh di: ${pdfUrl}`;
      } catch (err) {
        console.error("Error generate PDF (rekap semua):", err.message);
        replyText += `\n\n⚠️ Gagal membuat laporan PDF.`;
      }
      return NextResponse.json({ reply: replyText });
    }

    // 🧩 3️⃣ Kalau ada intent → jalankan query preset
    if (matched) {
      const cleanQuery = matched.query.trim().replace(/;$/, "");

      const { data: result, error: queryError } = await supabase.rpc("exec_sql", {
        sql: cleanQuery,
      });

      if (queryError) {
        console.error("Query error:", queryError.message);
        return NextResponse.json({
          reply: "⚠️ Terjadi kesalahan saat menjalankan query preset.",
        });
      }

      const cleanResult = Array.isArray(result) ? result : [result];
      if (cleanResult.length > 0) {
        const formatted = cleanResult
          .map((row, i) => {
            const values = Object.values(row)
              .map(v => (v ? v.toString() : "-"))
              .join(" — ");
            return `${i + 1}. ${values}`;
          })
          .join("\n");

        replyText = `🧾 Menampilkan ${matched.description}:\n\n${formatted}`;
      } else {
        replyText = `⚠️ Tidak ada data untuk "${matched.description}".`;
      }

      // 🔄 4️⃣ Kalau pesan mengandung laporan/rekap/pdf → generate PDF untuk intent ini
      if (isRekap) {
        try {
          const pdfType = matched.intent || "barang";
          const pdfUrl = await triggerPDF(pdfType);

          replyText += `\n\n📄 Laporan PDF untuk "${matched.description}" berhasil dibuat!`;
          if (pdfUrl) replyText += `\n👉 Unduh di: ${pdfUrl}`;
        } catch (err) {
          console.error("Error generate PDF:", err.message);
          replyText += `\n\n⚠️ Gagal membuat laporan PDF.`;
        }
      }

      return NextResponse.json({ reply: replyText });
    }

    // 🧩 5️⃣ Kalau tidak cocok ke intent apa pun → fallback ke OpenAI
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
              Kamu adalah Nadella Assistant, AI yang cerdas dan natural.
              Jawab dalam bahasa Indonesia yang sopan, tidak perlu menanyakan konfirmasi.
              Jika user meminta laporan, rekap, atau PDF, langsung panggil endpoint PDF.
              Hindari menyebut tabel sensitif seperti user atau admin.
            `,
          },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    const data = await aiRes.json();
    const text =
      data?.choices?.[0]?.message?.content ||
      "Maaf, aku belum mengerti pertanyaan kamu 😅";

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Chat POST error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
