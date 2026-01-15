export function detectTargetTable(question) {
  const q = question.toLowerCase();
  
  console.log(`🔍 Detecting table for: "${q}"`);

  const tableRules = [
    // ===== COMPANY & TEAM =====
    { table: "companies", keywords: ["company", "perusahaan", "firma", "bisnis"] },
    { table: "teams", keywords: ["team", "tim", "divisi", "department", "manager", "manajer"] },

    // ===== CORE BUSINESS TABLES =====
    { table: "deals", keywords: ["deal", "penawaran", "sales", "transaksi", "jual", "order"] },
    { 
      table: "customers", 
      // Tambahkan keyword relasional di sini
      keywords: ["customer", "pelanggan", "klien", "client", "pic", "perusahaan"] 
    },
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
    { table: "leads", keywords: ["lead", "prospek", "calon", "potential"] }
  ];

  let scores = [];

  // 1. Hitung skor untuk setiap tabel berdasarkan kecocokan keyword
  tableRules.forEach(rule => {
    let score = 0;
    rule.keywords.forEach(keyword => {
      if (q.includes(keyword)) {
        // Poin dasar: panjang karakter keyword (makin spesifik makin besar poinnya)
        score += keyword.length;
        
        // Bonus poin jika keyword ditemukan sebagai kata utuh (bukan bagian dari kata lain)
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        if (regex.test(q)) {
          score += 5;
        }
      }
    });

    if (score > 0) {
      scores.push({ table: rule.table, score: score });
    }
  });

  // 2. Sortir hasil berdasarkan skor tertinggi
  scores.sort((a, b) => b.score - a.score);

  // 3. Logika Penentu (Decision)
  if (scores.length > 0) {
    const topMatch = scores[0].table;
    
    // Kasus Khusus: Jika user menyebut "perusahaan" DAN "customer/afiliasi"
    // Kita pastikan customer yang menang jika ada indikasi relasi
    const hasAffiliation = q.includes("afiliasi") || q.includes("customer") || q.includes("pelanggan");
    const hasCompany = q.includes("perusahaan");

    if (hasCompany && hasAffiliation) {
        console.log(`🎯 Contextual match: customers (due to affiliation/customer keywords)`);
        return "customers";
    }

    console.log(`✅ Matched table: ${topMatch} (Score: ${scores[0].score})`);
    return topMatch;
  }

  // 4. Fallback: cari berdasarkan konteks pertanyaan jika tidak ada keyword tabel
  console.log("❌ No table matched, using smart fallback...");
  
  const fallbackKeywords = ["terbaru", "terlama", "berapa", "list", "tampilkan"];
  if (fallbackKeywords.some(word => q.includes(word))) {
    console.log("⚠️ Using default table: deals");
    return "deals";
  }
  
  return null;
}