export function detectTargetTable(question) {
  const q = question.toLowerCase();
  
  console.log(`🔍 Detecting table for: "${q}"`);

  // DAFTAR SEMUA TABEL YANG ADA DI DATABASE (dari schema Anda)
  const tableRules = [
    // ===== CORE BUSINESS TABLES =====
    { table: "deals", keywords: ["deal", "penawaran", "sales", "transaksi", "jual"] },
    { table: "customers", keywords: ["customer", "pelanggan", "klien", "client"] },
    { table: "products", keywords: ["produk", "product", "barang", "item"] },
    { table: "tickets", keywords: ["ticket", "tiket", "issue", "keluhan", "masalah"] },
    { table: "invoices", keywords: ["invoice", "faktur", "tagihan", "pembayaran"] },
    
    // ===== SERVICE RELATED =====
    { table: "services", keywords: ["service", "servis", "layanan", "jasa"] },
    { table: "service_cctv", keywords: ["cctv", "kamera", "security"] },
    { table: "service_cloud", keywords: ["cloud", "gcp", "aws", "google cloud", "amazon"] },
    { table: "service_sip_trunk", keywords: ["sip", "trunk", "voip", "telepon"] },
    { table: "service_products", keywords: ["serial", "imei", "config", "produk servis"] },
    
    // ===== MARKETING & ACTIVITIES =====
    { table: "campaigns", keywords: ["campaign", "kampanye", "promosi", "iklan", "marketing"] },
    { table: "activities", keywords: ["aktivitas", "activity", "kegiatan", "meeting", "rapat", "call", "telpon"] },
    { table: "communications", keywords: ["komunikasi", "communication", "email", "chat", "pesan", "whatsapp"] },
    { table: "leads", keywords: ["lead", "prospek", "calon", "potential"] },
    
    // ===== COMPANY & TEAM =====
    { table: "companies", keywords: ["company", "perusahaan", "firma", "bisnis"] },
    { table: "teams", keywords: ["team", "tim", "divisi", "department"] }
  ];

  // Cari tabel yang match
  for (const rule of tableRules) {
    for (const keyword of rule.keywords) {
      if (q.includes(keyword)) {
        console.log(`✅ Matched table: ${rule.table} (keyword: ${keyword})`);
        return rule.table;
      }
    }
  }

  console.log("❌ No table matched, using smart fallback...");
  
  // Fallback: cari berdasarkan konteks pertanyaan
  if (q.includes("terbaru") || q.includes("terlama") || q.includes("berapa")) {
    // Default ke deals untuk pertanyaan umum
    console.log("⚠️ Using default table: deals");
    return "deals";
  }
  
  return null;
}