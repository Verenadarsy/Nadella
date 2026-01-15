export function detectStrategy(question) {
  const q = question.toLowerCase().trim();
  
  console.log("🔍 Detecting strategy for:", q);

  // =====================
  // NON-DATA QUERIES
  // =====================
  // Greetings
  const greetings = ["halo", "hai", "hello", "hi", "hey", "hola"];
  const indoGreetings = ["apa kabar", "selamat pagi", "selamat siang", "selamat sore", "selamat malam"];
  
  if (greetings.some(g => q === g) || indoGreetings.some(g => q.includes(g))) {
    return "greeting";
  }

  // Help/General questions
  if (q.includes("bisa apa") || q.includes("help") || q.includes("bantuan") || 
      q.includes("fitur") || q.includes("fungsi") || q.includes("ability")) {
    return "general";
  }

  // Thanks/Farewell
  if (q.includes("terima kasih") || q.includes("thanks") || q.includes("makasih") ||
      q.includes("bye") || q.includes("dadah") || q.includes("sampai jumpa")) {
    return "chat";
  }

  // =====================
  // CHECK IF DATA QUESTION - TAMBAHKAN SEMUA ENTITIES!
  // =====================
  const dataEntities = [
    // Core business
    "deal", "ticket", "tiket", "customer", "pelanggan", "produk", "product", 
    "barang", "invoice", "faktur", "service", "layanan", "servis",
    
    // Marketing & Activities
    "campaign", "kampanye", "aktivitas", "activity", "kegiatan",
    "meeting", "call", "rapat", "komunikasi", "communication",
    
    // Leads & Companies
    "lead", "prospek", "company", "perusahaan",
    
    // Service related
    "cctv", "cloud", "sip", "trunk", "gcp", "aws",
    
    // Teams
    "team", "tim", "manager", "manajer",

    //customer
    "pic"
  ];
  
  const hasDataEntity = dataEntities.some(entity => q.includes(entity));
  
  if (!hasDataEntity) {
    return "chat";
  }

  // =====================
  // DATA QUERY STRATEGIES
  // =====================
  
  // Count queries - PERLUAS KE SEMUA ENTITY
  if ((q.includes("berapa") || q.includes("jumlah") || q.includes("total") || q.includes("banyak"))) {
    return "count";
  }

  // Date filters
  if (q.includes("hari ini") || q.includes("today")) {
    return "filter_today";
  }

  if (q.includes("kemarin") || q.includes("yesterday")) {
    return "filter_yesterday";
  }

  if (q.includes("minggu ini") || q.includes("this week")) {
    return "filter_week";
  }

  if (q.includes("bulan ini") || q.includes("this month")) {
    return "filter_month";
  }

  // Latest/Oldest
  if (q.includes("terbaru") || q.includes("terakhir") || q.includes("latest") ||
      (q.includes("baru") && !q.includes("bulan"))) {
    return "latest";
  }

  if (q.includes("terlama") || q.includes("pertama") || q.includes("oldest") || q.includes("first")) {
    return "oldest";
  }

  // Price/Value based
  if (q.includes("termurah") || q.includes("paling murah") || q.includes("cheapest") ||
      q.includes("harga terendah")) {
    return "cheapest";
  }

  if (q.includes("termahal") || q.includes("paling mahal") || q.includes("expensive") ||
      q.includes("harga tertinggi")) {
    return "expensive";
  }

  // List queries
  if (q.includes("list") || q.includes("daftar") || q.includes("tampilkan") || 
      q.includes("lihat") || q.includes("show") || q.includes("display")) {
    return "list";
  }

  // Narrative/Why questions
  if (q.includes("kenapa") || q.includes("mengapa") || q.includes("jelaskan") ||
      q.includes("bagaimana") || q.includes("alasan") || q.includes("sebab")) {
    return "semantic";
  }

  // Default for data queries
  return "list";
}