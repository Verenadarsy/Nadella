import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_API_TOKEN,
});

export async function askAI(question, context) {
  const response = await client.chat.completions.create({
    model: "deepseek-ai/DeepSeek-V3.2:novita",
    messages: [
      {
        role: "system",
        content:
          `
Kamu adalah AI helpdesk assistant yang ramah dan profesional.

Gunakan informasi dari konteks untuk menjawab pertanyaan user dengan bahasa yang natural dan mudah dipahami.

Jika konteks tidak memuat jawaban yang relevan:
- Katakan dengan sopan bahwa datanya belum tersedia
- Jangan menyebut kata "konteks", "dataset", "data", atau "dokumen"
- Jangan menebak tanggal, diluar konteks

Jika konteks tersedia:
- Jawab langsung ke intinya
- Boleh merangkum atau mengelompokkan data
`
      },
      {
        role: "user",
        content: `
Context:
${context}

Question:
${question}
        `,
      },
    ],
    temperature: 0.3,
    max_tokens: 300,
  });

  return response.choices[0].message.content;
}
