import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { format, parse, startOfMonth, endOfMonth, startOfYear, 
         endOfYear, startOfWeek, endOfWeek, subDays, subMonths, 
         subYears, isValid } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getWIB } from "@/app/utils/getWIB";

// ============================================
// DATE PARSER UTILITY FUNCTIONS
// ============================================

/** 
 * Parse periode dari teks bahasa Indonesia (lebih komprehensif)
 **/
export function parseDateRangeFromText(text) {
  if (!text || typeof text !== 'string') return null;
  
  const lowerText = text.toLowerCase().trim();
  
  // Dictionary bulan Indonesia
  const monthMap = {
    'januari': 0, 'februari': 1, 'maret': 2, 'april': 3,
    'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7,
    'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
  };
  
  // Periode khusus dengan prioritas
  const periodKeywords = [
    { pattern: 'hari ini', type: 'today' },
    { pattern: 'kemarin', type: 'yesterday' },
    { pattern: 'minggu ini', type: 'this_week' },
    { pattern: 'minggu lalu', type: 'last_week' },
    { pattern: 'bulan ini', type: 'this_month' },
    { pattern: 'bulan lalu', type: 'last_month' },
    { pattern: 'tahun ini', type: 'this_year' },
    { pattern: 'tahun lalu', type: 'last_year' },
    { pattern: 'semua waktu', type: 'all_time' },
    { pattern: 'semua periode', type: 'all_time' },
    { pattern: 'full rekap', type: 'all_time' }
  ];
  
  // 1. Cek periode khusus terlebih dahulu
  for (const { pattern, type } of periodKeywords) {
    if (lowerText.includes(pattern)) {
      return generateDateFilter(type);
    }
  }
  
  // 2. Parse bulan spesifik dengan tahun
  for (const [monthName, monthIndex] of Object.entries(monthMap)) {
    if (lowerText.includes(monthName)) {
      return parseMonthFromText(lowerText, monthName, monthIndex);
    }
  }
  
  // 3. Parse tahun spesifik
  const yearMatch = lowerText.match(/(?:tahun\s+)?(\d{4})/);
  if (yearMatch && !lowerText.includes('bulan')) {
    const year = parseInt(yearMatch[1]);
    return {
      type: 'date_range',
      display: `Tahun ${year}`,
      startDate: format(new Date(year, 0, 1), 'yyyy-MM-dd'),
      endDate: format(new Date(year, 11, 31), 'yyyy-MM-dd'),
      column: 'created_at'
    };
  }
  
  // 4. Parse range tanggal (e.g., "1-31 maret 2024")
  const rangeMatch = lowerText.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?/);
  if (rangeMatch) {
    const [, startDay, endDay, monthName, year] = rangeMatch;
    const monthIndex = monthMap[monthName.toLowerCase()];
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    return {
      type: 'date_range',
      display: `${startDay}-${endDay} ${monthName} ${currentYear}`,
      startDate: format(new Date(currentYear, monthIndex, parseInt(startDay)), 'yyyy-MM-dd'),
      endDate: format(new Date(currentYear, monthIndex, parseInt(endDay)), 'yyyy-MM-dd'),
      column: 'created_at'
    };
  }
  
  // 5. Parse tanggal spesifik (DD/MM/YYYY atau DD-MM-YYYY)
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g;
  const dateMatches = [...lowerText.matchAll(dateRegex)];
  
  if (dateMatches.length === 1) {
    const [, day, month, year] = dateMatches[0];
    return {
      type: 'specific_date',
      date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
      display: `${day}/${month}/${year}`,
      column: 'created_at'
    };
  } else if (dateMatches.length === 2) {
    // Range dari dua tanggal
    const [, startDay, startMonth, startYear] = dateMatches[0];
    const [, endDay, endMonth, endYear] = dateMatches[1];
    
    const startDate = `${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`;
    const endDate = `${endYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}`;
    
    return {
      type: 'date_range',
      display: `${startDay}/${startMonth}/${startYear} - ${endDay}/${endMonth}/${endYear}`,
      startDate,
      endDate,
      column: 'created_at'
    };
  }
  
  return null;
}

/*
 * Parse bulan spesifik dari teks
 */
function parseMonthFromText(text, monthName, monthIndex) {
  const today = new Date();
  let year = today.getFullYear();
  
  // Cari tahun dalam teks
  const yearMatch = text.match(/(\d{4})/);
  if (yearMatch) {
    year = parseInt(yearMatch[1]);
  } else if (text.includes('tahun')) {
    const tahunMatch = text.match(/tahun\s+(\d{4})/);
    if (tahunMatch) {
      year = parseInt(tahunMatch[1]);
    }
  }
  
  // Cari apakah ada kata "lalu" untuk bulan/tahun lalu
  if (text.includes('lalu') && !text.includes('bulan lalu') && !text.includes('tahun lalu')) {
    if (text.includes('bulan')) {
      // "bulan desember lalu"
      const targetDate = new Date(year - 1, monthIndex, 1);
      year = targetDate.getFullYear();
    }
  }
  
  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0);
  
  return {
    type: 'date_range',
    display: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    column: 'created_at'
  };
}

/*
 * Generate date filter object
 */
function generateDateFilter(periodType) {
  const today = new Date();
  let startDate, endDate, display;
  
  switch(periodType) {
    case 'today':
      startDate = endDate = format(today, 'yyyy-MM-dd');
      display = `Hari Ini (${format(today, 'dd/MM/yyyy')})`;
      break;
      
    case 'yesterday':
      const yesterday = subDays(today, 1);
      startDate = endDate = format(yesterday, 'yyyy-MM-dd');
      display = `Kemarin (${format(yesterday, 'dd/MM/yyyy')})`;
      break;
      
    case 'this_week':
      startDate = format(startOfWeek(today, { locale: idLocale }), 'yyyy-MM-dd');
      endDate = format(endOfWeek(today, { locale: idLocale }), 'yyyy-MM-dd');
      display = `Minggu Ini (${format(new Date(startDate), 'dd/MM')} - ${format(new Date(endDate), 'dd/MM/yyyy')})`;
      break;
      
    case 'last_week':
      const lastWeek = subDays(today, 7);
      startDate = format(startOfWeek(lastWeek, { locale: idLocale }), 'yyyy-MM-dd');
      endDate = format(endOfWeek(lastWeek, { locale: idLocale }), 'yyyy-MM-dd');
      display = `Minggu Lalu (${format(new Date(startDate), 'dd/MM')} - ${format(new Date(endDate), 'dd/MM/yyyy')})`;
      break;
      
    case 'this_month':
      startDate = format(startOfMonth(today), 'yyyy-MM-dd');
      endDate = format(endOfMonth(today), 'yyyy-MM-dd');
      display = `Bulan Ini (${format(today, 'MMMM yyyy', { locale: idLocale })})`;
      break;
      
    case 'last_month':
      const lastMonth = subMonths(today, 1);
      startDate = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
      endDate = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
      display = `Bulan Lalu (${format(lastMonth, 'MMMM yyyy', { locale: idLocale })})`;
      break;
      
    case 'this_year':
      startDate = format(startOfYear(today), 'yyyy-MM-dd');
      endDate = format(endOfYear(today), 'yyyy-MM-dd');
      display = `Tahun Ini (${format(today, 'yyyy')})`;
      break;
      
    case 'last_year':
      const lastYear = subYears(today, 1);
      startDate = format(startOfYear(lastYear), 'yyyy-MM-dd');
      endDate = format(endOfYear(lastYear), 'yyyy-MM-dd');
      display = `Tahun Lalu (${format(lastYear, 'yyyy')})`;
      break;
      
    case 'all_time':
      return {
        type: 'all_time',
        display: 'Semua Waktu',
        column: 'created_at'
      };
      
    default:
      return null;
  }
  
  return {
    type: 'date_range',
    display,
    startDate,
    endDate,
    column: 'created_at'
  };
}

// ============================================
// PDF INTENT & PARAMETER DETECTION
// ============================================

/*
 * Deteksi apakah ini permintaan PDF
 */
function isPDFRequest(message) {
  const lowerMsg = message.toLowerCase().trim();
  
  const pdfKeywords = [
    "pdf", "rekap", "laporan", "export", "download", 
    "cetak", "print", "unduh", "simpan", "save as",
    "buat pdf", "generate pdf", "export pdf", "download pdf",
    "buat laporan", "cetak laporan", "unduh laporan",
    "report", "export data", "data sheet"
  ];
  
  // Cek exact match untuk rekap semua
  if (lowerMsg === 'rekap semua' || lowerMsg === 'rekap keseluruhan') {
    return true;
  }
  
  return pdfKeywords.some(keyword => lowerMsg.includes(keyword));
}

/*
 * Deteksi intent PDF dari pesan
 */
function detectPDFIntent(message) {
  const lowerMsg = message.toLowerCase().trim();
  
  // PRIORITY 1: Rekap semua/keseluruhan
  const rekapKeywords = [
    'rekap semua', 'rekap keseluruhan', 'laporan keseluruhan',
    'semua data', 'full report', 'export semua', 'full rekap',
    'pdf rekap semua', 'export keseluruhan', 'semua tabel',
    'seluruh data', 'full export', 'semua laporan'
  ];
  
  for (const keyword of rekapKeywords) {
    if (lowerMsg.includes(keyword)) {
      return 'rekap_semua';
    }
  }
  
  // PRIORITY 2: Intent spesifik
  const intentMap = {
    // Produk
    'produk': 'product_list', 'product': 'product_list', 'barang': 'product_list',
    
    // Customer
    'customer': 'customer_list', 'pelanggan': 'customer_list', 'klien': 'customer_list',
    
    // Deals
    'deal': 'deals_list', 'penawaran': 'deals_list', 'kesepakatan': 'deals_list', 'deals closed won': 'deals_closed_won',
  'deals won': 'deals_closed_won',
  'deals menang': 'deals_closed_won',
  'deals kalah': 'deals_closed_lost', 
  'deals lost': 'deals_closed_lost',
  'deal won': 'deals_closed_won',
  'deal menang': 'deals_closed_won',
  'deal kalah': 'deals_closed_lost', 
  'deal lost': 'deals_closed_lost',
  'closed lost': 'deals_closed_lost',
  'deals prospect': 'deals_open',
  'deals negotiation': 'deals_nego',
  'deals negosiasi': 'deals_nego',
  'deal prospek': 'deals_open',
  'deals progress': 'deals_open',
  'deal progress': 'deals_open',
    
    // Invoice
    'invoice': 'invoice_list', 'tagihan': 'invoice_unpaid', 'faktur': 'invoice_unpaid',
    
    // Tickets
    'ticket': 'tickets_list', 'tiket': 'tickets_list', 'issue': 'tickets_list',
    
    // Services
    'service': 'rekap_services', 'layanan': 'rekap_services', 'jasa': 'rekap_services', 'service cctv': 'service_cctv', 'cctv': 'service_cctv', 'service trunk': 'service_trunk', 'sip trunk': 'service_trunk', 'service cloud': 'service_cloud', 'cloud service': 'service_cloud',
    'layanan cctv': 'service_cctv', 'servis cctv': 'service_cctv', 'layanan trunk': 'service_trunk', 'servis trunk': 'service_trunk', 'sip trunk': 'service_trunk', 'service cloud': 'service_cloud', 'layanan cloud': 'service_cloud',
    'servis cloud': 'service_cloud', 'servis': 'rekap_services',
    // Campaigns
    'campaign': 'campaign_list', 'kampanye': 'campaign_list', 'promosi': 'campaign_list',
    
    // Leads
    'lead': 'leads_list', 'prospek': 'leads_list', 'calon': 'leads_list',
    
    // Companies
    'company': 'company_list', 'perusahaan': 'company_list', 'firma': 'company_list',
    
    // Activities
    'aktivitas': 'activities_list', 'activity': 'activities_list', 'kegiatan': 'activities_list',
    
    // Communications
    'komunikasi': 'communications_list', 'communication': 'communications_list', 'pesan': 'communications_list',
    
    // Teams
    'tim': 'teams_list', 'team': 'teams_list', 'anggota': 'teams_list',
  };
  
  // Cari intent terbaik (prioritaskan yang lebih spesifik)
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [keyword, intent] of Object.entries(intentMap)) {
    // Skor berdasarkan match quality
    let score = 0;
    
    // Exact match mendapat skor tertinggi
    if (lowerMsg === keyword || 
        lowerMsg === `buat ${keyword}` || 
        lowerMsg === `export ${keyword}` ||
        lowerMsg === `rekap ${keyword}`) {
      score = 100;
    } 
    // Partial match dengan "pdf" atau "laporan"
    else if (lowerMsg.includes(`pdf ${keyword}`) || 
             lowerMsg.includes(`laporan ${keyword}`)) {
      score = 80;
    }
    // Partial match saja
    else if (lowerMsg.includes(keyword)) {
      score = 60;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }
  
  return bestMatch;
}

/*
 * Ekstrak parameter dari pesan
 */
function extractParameters(message) {
  const params = {};
  
  // 1. Parse tanggal
  const dateFilter = parseDateRangeFromText(message);
  if (dateFilter) {
    params.dateFilter = dateFilter;
  }
  
  // 2. Parse ID
  const idMatch = message.match(/(?:id|nomor|no)[\s:]+['"]?([a-z0-9_-]+)['"]?/i);
  if (idMatch) {
    params.id = idMatch[1];
  }
  
  // 3. Parse nama
  const nameMatch = message.match(/(?:nama|name)[\s:]+['"]?([a-z\s]+)['"]?/i);
  if (nameMatch) {
    params.name = nameMatch[1].trim();
  }
  
  // 4. Parse status
  const statusKeywords = ['aktif', 'active', 'pending', 'selesai', 'completed', 'ditolak', 'rejected'];
  for (const status of statusKeywords) {
    if (message.toLowerCase().includes(status)) {
      params.status = status;
      break;
    }
  }
  
  const dealStages = ['prospect', 'negotiation', 'closed won', 'closed lost'];
  for (const stage of dealStages) {
    if (message.toLowerCase().includes(stage)) {
      params.stage = stage;
      break;
    }
  }
  
  // 3. Parse service type
  const serviceTypes = ['cctv', 'trunk', 'cloud', 'sip'];
  for (const service of serviceTypes) {
    if (message.toLowerCase().includes(service)) {
      params.serviceType = service;
      break;
    }
  }

  return params;
}

// ============================================
// PDF GENERATION TRIGGER
// ============================================

/*
 * Trigger PDF generation dengan sistem baru
 */
async function triggerSmartPDF(type, parameters = null, rawQuery = null) {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseURL}/api/pdf-generate`;
  
  console.log(`📤 Calling PDF API: ${url} with type: "${type}"`);
  
  const payload = {
    type: type,
    timestamp: new Date().toISOString()
  };
  
  // Tambahkan parameters jika ada
  if (parameters) {
    payload.parameters = parameters;
  }
  
  // Tambahkan rawQuery untuk smart date parsing
  if (rawQuery) {
    payload.rawQuery = rawQuery;
  }
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log(`📥 Response Status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ PDF API Error ${res.status}:`, errorText);
      
      let errorMessage = `PDF API error: ${res.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.detail || errorText;
        if (errorJson.suggestion) {
          errorMessage += `\n\nSuggestion: ${errorJson.suggestion}`;
        }
      } catch {
        errorMessage = errorText;
      }
      
      throw new Error(errorMessage);
    }

    const result = await res.json();
    console.log("✅ PDF generated successfully:", result);
    return result;
    
  } catch (err) {
    console.error("❌ triggerSmartPDF error:", err.message);
    
    // Return error dengan struktur yang konsisten
    return {
      success: false,
      error: err.message,
      url: null,
      timestamp: new Date().toISOString()
    };
  }
}

// ============================================
// FALLBACK DATA QUERY
// ============================================

/*
 * Query data langsung sebagai fallback
 */
async function queryDirectDataFallback(intent, parameters = {}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    // Cari preset query
    const { data: preset } = await supabase
      .from("queries_preset")
      .select("query, description")
      .eq("intent", intent)
      .single();
    
    if (!preset) {
      // Coba cari dengan LIKE
      const { data: similar } = await supabase
        .from("queries_preset")
        .select("query, description, intent")
        .or(`intent.ilike.%${intent}%,description.ilike.%${intent}%`)
        .limit(1);
      
      if (similar && similar.length > 0) {
        return queryDirectDataFallback(similar[0].intent, parameters);
      }
      throw new Error(`Preset tidak ditemukan: ${intent}`);
    }
    
    // Simple query tanpa RPC
    const tableMatch = preset.query.match(/from\s+(\w+)/i);
    if (!tableMatch) {
      throw new Error("Tabel tidak ditemukan dalam query");
    }
    
    const tableName = tableMatch[1];
    let queryBuilder = supabase.from(tableName).select('*');
    
    // Apply date filter jika ada
    if (parameters.dateFilter) {
      const dateColumn = 'created_at';
      if (parameters.dateFilter.type === 'date_range') {
        queryBuilder = queryBuilder
          .gte(dateColumn, parameters.dateFilter.startDate)
          .lte(dateColumn, parameters.dateFilter.endDate);
      } else if (parameters.dateFilter.date) {
        queryBuilder = queryBuilder.eq(dateColumn, parameters.dateFilter.date);
      }
    }
    
    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (error) throw error;
    
    return {
      success: true,
      data: data || [],
      description: preset.description,
      intent: intent,
      dateFilter: parameters.dateFilter
    };
    
  } catch (error) {
    console.error("Direct query error:", error);
    return {
      success: false,
      error: error.message,
      data: [],
      description: `Error: ${error.message}`
    };
  }
}

// ============================================
// RESPONSE FORMATTER
// ============================================

/*
 * Format response untuk PDF berhasil
 */
function formatPDFSuccessResponse(pdfResult, intent, parameters) {
  let reply = `✅ Laporan PDF Berhasil Dibuat!\n\n`;
  
  if (pdfResult.description) {
    reply += `📄 ${pdfResult.description}\n`;
  } else {
    reply += `📄 Laporan ${intent.replace('_', ' ').toUpperCase()}\n`;
  }
  
  reply += `🔗 [📥 Download PDF](${pdfResult.url})\n\n`;
  
  if (pdfResult.totalData !== undefined) {
    reply += `📊 Total Data: ${pdfResult.totalData} record\n`;
  }
  
  if (parameters?.dateFilter) {
    reply += `📅 Periode: ${parameters.dateFilter.display}\n`;
  }
  
  reply += `\n⏰ Waktu Generate: ${format(getWIB(), 'HH:mm')}`;
  
  if (pdfResult.period) {
    reply += `\n🗓️ Rentang: ${pdfResult.period}`;
  }
  
  return reply;
}

/*
 * Format response untuk data fallback
 */
function formatDataFallbackResponse(dataResult, intent, parameters, pdfError = null) {
  const { data, description, success } = dataResult;
  
  if (!success || !data || data.length === 0) {
    let reply = `📭 Tidak Ada Data Ditemukan\n\n`;
    
    if (parameters?.dateFilter) {
      reply += `Untuk periode: ${parameters.dateFilter.display}\n\n`;
    }
    
    reply += `Coba dengan:\n• Periode yang berbeda\n• Filter yang lebih spesifik\n• Tabel lain`;
    
    if (pdfError) {
      reply += `\n\n❌ PDF Gagal: ${pdfError}`;
    }
    
    return reply;
  }
  
  let reply = `📊 ${description}\n\n`;
  
  if (parameters?.dateFilter) {
    reply += `📅 Periode: ${parameters.dateFilter.display}\n`;
  }
  
  reply += `✅ Total Data: ${data.length} record\n\n`;
  
  // Tampilkan sample data
  const sampleCount = Math.min(3, data.length);
  reply += `Contoh Data (${sampleCount} dari ${data.length}):\n`;
  
  const sample = data.slice(0, sampleCount);
  const headers = Object.keys(sample[0] || {}).slice(0, 3); // Ambil 3 kolom pertama
  
  sample.forEach((item, idx) => {
    reply += `${idx + 1}. `;
    headers.forEach(header => {
      if (item[header]) {
        const value = item[header].toString();
        reply += `${header}: ${value.length > 30 ? value.substring(0, 30) + '...' : value} `;
      }
    });
    reply += '\n';
  });
  
  if (data.length > sampleCount) {
    reply += `\n📋 *Dan ${data.length - sampleCount} record lainnya...*\n`;
  }
  
  reply += `\n💡 Untuk laporan lengkap, ketik: "buat PDF ${intent}"`;
  
  if (parameters?.dateFilter) {
    reply += ` ${parameters.dateFilter.display}`;
  }
  
  if (pdfError) {
    reply += `\n\n⚠️ Note: PDF gagal dibuat: ${pdfError}`;
  }
  
  return reply;
}

// ============================================
// MAIN POST HANDLER
// ============================================

export async function POST(req) {
  try {
    const { message } = await req.json();
    
    if (!message || message.trim() === "") {
      return NextResponse.json({ 
        reply: "Pertanyaan tidak boleh kosong 😊" 
      });
    }

    console.log(`💬 Chat request: "${message}"`);
    
    const cleanMessage = message.trim();
    const lowerMsg = cleanMessage.toLowerCase();
    
    // ==========================================
    // 1. CHECK IF THIS IS A PDF REQUEST
    // ==========================================
    if (isPDFRequest(lowerMsg)) {
      const pdfIntent = detectPDFIntent(lowerMsg);
      const parameters = extractParameters(cleanMessage);
      
      console.log(`📄 Detected PDF intent: ${pdfIntent}`, parameters);
      
      if (!pdfIntent) {
        return NextResponse.json({
          reply: `❌ Permintaan tidak jelas\n\nSaya tidak bisa mengidentifikasi jenis laporan yang Anda minta.\n\nContoh yang valid:\n• "buat PDF produk"\n• "rekap customer"\n• "export invoice bulan ini"\n• "laporan deals 2024"`,
          metadata: {
            type: "error",
            error: "Intent tidak terdeteksi"
          }
        });
      }
      
      // ==========================================
      // SPECIAL CASE: REKAP SEMUA
      // ==========================================
      if (pdfIntent === 'rekap_semua') {
        try {
          const pdfResult = await triggerSmartPDF('rekap semua', parameters, cleanMessage);
          
          if (!pdfResult.success) {
            throw new Error(pdfResult.error || "Gagal membuat rekap semua");
          }
          
          return NextResponse.json({
            reply: formatPDFSuccessResponse(pdfResult, 'rekap_semua', parameters),
            metadata: {
              type: "pdf_report_full",
              pdfUrl: pdfResult.url,
              intent: 'rekap_semua',
              fullReport: true,
              tableCount: pdfResult.tableCount,
              totalData: pdfResult.totalData,
              dateFilter: parameters.dateFilter
            }
          });
        } catch (error) {
          console.error("Full rekap error:", error);
          
          return NextResponse.json({
            reply: `❌ Gagal Membuat Rekap Lengkap\n\nError: ${error.message}\n\nSaran:\n1. Coba buat laporan per kategori:\n   • "buat PDF produk"\n   • "buat PDF customer"\n   • "buat PDF invoice"\n2. Cek koneksi server\n3. Hubungi administrator`,
            metadata: {
              type: "error",
              intent: 'rekap_semua',
              error: error.message
            }
          });
        }
      }
      
      // ==========================================
      // NORMAL PDF REQUEST
      // ==========================================
      try {
        const pdfResult = await triggerSmartPDF(pdfIntent, parameters, cleanMessage);
        
        if (!pdfResult.success) {
          throw new Error(pdfResult.error || "Gagal membuat PDF");
        }
        
        return NextResponse.json({
          reply: formatPDFSuccessResponse(pdfResult, pdfIntent, parameters),
          metadata: {
            type: "pdf_report",
            pdfUrl: pdfResult.url,
            intent: pdfIntent,
            description: pdfResult.description,
            totalData: pdfResult.totalData,
            dateFilter: parameters.dateFilter,
            period: pdfResult.period
          }
        });
        
      } catch (pdfError) {
        console.error("PDF generation failed:", pdfError);
        
        // FALLBACK: Tampilkan data langsung
        const directData = await queryDirectDataFallback(pdfIntent, parameters);
        
        return NextResponse.json({
          reply: formatDataFallbackResponse(directData, pdfIntent, parameters, pdfError.message),
          metadata: {
            type: "data_fallback",
            intent: pdfIntent,
            dataCount: directData.data?.length || 0,
            dateFilter: parameters.dateFilter,
            pdfFailed: true,
            pdfError: pdfError.message
          }
        });
      }
    }
    
    // ==========================================
    // 2. NOT A PDF REQUEST - USE RAG SYSTEM
    // ==========================================
    console.log(`🤖 Forwarding to RAG system: "${cleanMessage}"`);
    
    // Parse tanggal untuk konteks tambahan
    const dateFilter = parseDateRangeFromText(cleanMessage);
    
    // Enhance message dengan konteks tanggal jika ada
    let enhancedMessage = cleanMessage;
    if (dateFilter) {
      enhancedMessage = `${cleanMessage} [Periode: ${dateFilter.display}]`;
    }
    
    try {
      const ragResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/ask`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(req.headers.get("authorization") && { 
            "Authorization": req.headers.get("authorization") 
          })
        },
        body: JSON.stringify({ 
          question: enhancedMessage,
          includeRawData: true
        }),
      });

      if (!ragResponse.ok) {
        throw new Error(`RAG system error: ${ragResponse.status}`);
      }

      const ragData = await ragResponse.json();
      console.log("✅ RAG Response:", { 
        type: ragData.type, 
        sources: ragData.sources?.length || 0 
      });

      // ==========================================
      // 3. FORMAT RAG RESPONSE WITH SMART FEATURES
      // ==========================================
      let reply = ragData.answer || "Maaf, saya tidak bisa menjawab pertanyaan itu.";
      
      // Tambahkan konteks tanggal jika ada
      if (dateFilter) {
        reply += `\n\n📅 Konteks Periode: ${dateFilter.display}`;
      }
      
      // Tambahkan info sumber data
      if (ragData.sources && ragData.sources.length > 0) {
        const dataCount = ragData.sources.length;
        reply += `\n\n📊 Referensi Data: ${dataCount} record ditemukan`;
        
        // Auto-suggest PDF jika data banyak dan relevan
        const hasRelevantData = ragData.type === "data" || 
                               ragData.answer.toLowerCase().includes('data') ||
                               ragData.answer.toLowerCase().includes('record');
        
        if (hasRelevantData && dataCount >= 3) {
          // Deteksi tabel dari sources
          const sourceTables = ragData.sources
            .map(s => s.source_table)
            .filter(Boolean);
          
          const uniqueTables = [...new Set(sourceTables)];
          
          if (uniqueTables.length === 1) {
            const table = uniqueTables[0];
            let suggestion = `\n\n💡 Ingin laporan lengkap?\nKetik "buat PDF ${table}"`;
            
            if (dateFilter) {
              suggestion += ` ${dateFilter.display}`;
            }
            
            suggestion += ` untuk export data dalam format PDF.`;
            reply += suggestion;
          } else if (uniqueTables.length > 1) {
            reply += `\n\n💡 Data berasal dari ${uniqueTables.length} tabel berbeda.`;
            reply += `\nKetik "rekap semua" untuk laporan sistem lengkap.`;
          }
        }
      } else if (ragData.type === "data") {
        // Jika RAG mengatakan ini tentang data tapi tidak ada sources
        reply += `\n\n💡 Tips: Untuk query data spesifik, coba format:\n`;
        reply += `• "data produk hari ini"\n`;
        reply += `• "customer aktif bulan ini"\n`;
        reply += `• "rekap invoice 2024"`;
      }
      
      // Tambahkan tombol cepat untuk PDF jika relevan
      const hasDataKeywords = lowerMsg.includes('data') || 
                             lowerMsg.includes('list') || 
                             lowerMsg.includes('daftar') ||
                             lowerMsg.includes('rekap') ||
                             lowerMsg.includes('laporan');
      
      if (hasDataKeywords && !lowerMsg.includes('pdf')) {
        // Coba deteksi intent sederhana
        const simpleIntent = detectPDFIntent(lowerMsg);
        if (simpleIntent && simpleIntent !== 'rekap_semua') {
          reply += `\n\n🚀 Quick Action: Ketik "PDF ${simpleIntent}"`;
          if (dateFilter) {
            reply += ` ${dateFilter.display}`;
          }
          reply += ` untuk langsung membuat laporan.`;
        }
      }

      return NextResponse.json({ 
        reply,
        metadata: {
          type: ragData.type || "chat",
          dataCount: ragData.sources?.length || 0,
          dateFilter: dateFilter,
          suggestedPdf: hasDataKeywords,
          sources: ragData.sources?.slice(0, 3) || [],
          timestamp: new Date().toISOString()
        }
      });

    } catch (ragError) {
      console.error("RAG system error:", ragError);
      
      // FALLBACK: Coba deteksi apakah ini permintaan data sederhana
      const simpleIntent = detectPDFIntent(lowerMsg);
      if (simpleIntent) {
        const parameters = extractParameters(cleanMessage);
        const directData = await queryDirectDataFallback(simpleIntent, parameters);
        
        if (directData.success && directData.data.length > 0) {
          return NextResponse.json({
            reply: formatDataFallbackResponse(directData, simpleIntent, parameters),
            metadata: {
              type: "data_fallback",
              intent: simpleIntent,
              dataCount: directData.data.length,
              dateFilter: parameters.dateFilter,
              ragFailed: true
            }
          });
        }
      }
      
      return NextResponse.json({
        reply: `❌ Sistem AI sedang tidak tersedia\n\nError: ${ragError.message}\n\nAlternatif:\n• Coba query data langsung: "data produk"\n• Gunakan filter tanggal: "invoice bulan ini"\n• Hubungi administrator untuk bantuan`,
        metadata: {
          type: "system_error",
          error: ragError.message,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error("💥 Chat route error:", error);
    
    return NextResponse.json({
      reply: `❌ Terjadi Kesalahan Sistem\n\n${error.message}\n\nSilakan coba lagi atau hubungi administrator.`,
      metadata: {
        type: "critical_error",
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// ============================================
// GET ENDPOINT FOR TESTING & DOCS
// ============================================

export async function GET() {
  const today = new Date();
  
  return NextResponse.json({
    message: "🤖 Chat API with Smart PDF Integration",
    version: "2.0",
    description: "Advanced chat system with date-aware PDF generation",
    
    features: {
      dateParsing: [
        "Natural language date parsing (Bahasa Indonesia)",
        "Support: hari ini, kemarin, minggu ini, bulan ini, bulan lalu",
        "Support: specific dates (DD/MM/YYYY)",
        "Support: date ranges",
        "Auto-detection of month names"
      ],
      
      pdfGeneration: [
        "Smart intent detection",
        "Date-aware query filtering",
        "Multi-table full system reports",
        "Fallback to direct data display",
        "Adaptive response formatting"
      ],
      
      errorHandling: [
        "Graceful degradation on failures",
        "Multiple fallback strategies",
        "User-friendly error messages",
        "Smart suggestions"
      ]
    },
    
    usage: {
      pdfRequests: [
        "buat PDF produk",
        "rekap customer bulan ini",
        "export invoice 2024",
        "laporan deals Q1 2024",
        "rekap semua"
      ],
      
      dateFilters: [
        "produk hari ini",
        "invoice kemarin",
        "customer bulan ini",
        "deals bulan lalu",
        "data 01/01/2024 sampai 31/12/2024"
      ],
      
      simpleQueries: [
        "data produk terbaru",
        "berapa customer aktif",
        "tampilkan invoice pending",
        "status deals"
      ]
    },
    
    systemInfo: {
      today: format(today, 'dd MMMM yyyy', { locale: idLocale }),
      apiVersion: "v2",
      supportsRawQuery: true,
      hasDateAwareness: true,
      timestamp: new Date().toISOString()
    }
  });
}