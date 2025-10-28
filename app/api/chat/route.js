import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// 🧠 Fungsi bantu buat matching intent paling relevan
function matchIntent(message, intents) {
  const msg = message.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const intent of intents) {
    const kwList = intent.keywords?.split(",").map(k => k.trim()) || [];
    let score = 0;

    // 🎯 Cek kecocokan kata kunci
    kwList.forEach(k => {
      if (msg.includes(k)) score += 1;
    });

    // 🎯 Bonus poin kalau intent id atau deskripsinya juga cocok
    if (msg.includes(intent.intent)) score += 2;
    if (msg.includes(intent.description.split(" ")[1]?.toLowerCase())) score += 1;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }

  return bestMatch;
}

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

    // 1️⃣ Ambil semua preset intent dari tabel
    const { data: intents, error: intentError } = await supabase
      .from("queries_preset")
      .select("*");

    if (intentError) throw intentError;

    // 2️⃣ Gunakan sistem scoring buat tentukan query paling cocok
    const matched = matchIntent(lowerMsg, intents);

    // 3️⃣ Kalau ketemu query cocok → jalankan SQL-nya
    if (matched) {
      const cleanQuery = matched.query.trim().replace(/;$/, "");

      const { data: result, error: queryError } = await supabase.rpc(
        "exec_sql",
        { sql: cleanQuery }
      );

      if (queryError) {
        console.error("Query error:", queryError.message);
        return NextResponse.json({
          reply:
            "⚠️ Ada kesalahan saat menjalankan query. Pastikan query preset benar ya.",
        });
      }

      const cleanResult = Array.isArray(result) ? result[0] : result;
      const total =
        cleanResult?.total ||
        cleanResult?.total_admin ||
        cleanResult?.total_budget ||
        cleanResult?.count;

      // 🗣️ Format jawaban agar lebih natural
      let replyText = "";

      if (total !== undefined) {
        replyText = `📊 ${matched.description} saat ini berjumlah **${total}**.`;
      } else if (Array.isArray(result) && result.length > 0) {
        const formatted = result
          .map((row, i) => {
            const values = Object.values(row)
              .map(v => (v ? v.toString() : "-"))
              .join(" — ");
            return `${i + 1}. ${values}`;
          })
          .join("\n");
        replyText = `📋 ${matched.description}:\n${formatted}`;
      } else {
        replyText = `⚠️ Tidak ada data untuk "${matched.description}".`;
      }

      return NextResponse.json({ reply: replyText });
    }

    // 4️⃣ Fallback ke OpenAI untuk pertanyaan bebas
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
              You are Nadella Assistant — a friendly and smart CRM AI.
              You help users find info about customers, products, campaigns, leads, and reports.
              If the question is unclear, ask a polite clarification.
              Respond naturally in Indonesian with a touch of friendliness.
            `,
          },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 300,
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
