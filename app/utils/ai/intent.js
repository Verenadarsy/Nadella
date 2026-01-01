export function detectIntent(question) {
  const q = question.toLowerCase();

  return {
    needs_sql:
      q.includes("berapa") ||
      q.includes("jumlah") ||
      q.includes("total") ||
      q.includes("terbaru") ||
      q.includes("hari ini") ||
      q.includes("bulan ini"),

    needs_vector:
      q.includes("kenapa") ||
      q.includes("alasan") ||
      q.includes("ringkasan") ||
      q.includes("jelaskan"),

    entities: {
      tickets: q.includes("ticket") || q.includes("tiket"),
      customers: q.includes("customer") || q.includes("pelanggan"),
      products: q.includes("produk"),
      invoices: q.includes("invoice"),
    }
  };
}
