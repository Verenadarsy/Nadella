import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { getWIB } from "@/app/utils/getWIB";


function applyDateFilterToQuery(baseQuery, dateFilter) {
  if (!dateFilter || !baseQuery) return baseQuery;
  
  console.log(`📅 Applying date filter: ${dateFilter.display}`);
  
  let dateColumn = dateFilter.column || 'created_at';
  if (!dateColumn && baseQuery.includes('tanggal_dibuat')) dateColumn = 'tanggal_dibuat';
  else if (!dateColumn && baseQuery.includes('tanggal')) dateColumn = 'tanggal';
  else if (!dateColumn && baseQuery.includes('date')) dateColumn = 'date';
  
  console.log(`📍 Using date column: ${dateColumn}`);
  
  let queryWithoutOrder = baseQuery.replace(/ORDER BY.*$/i, '').trim();
  queryWithoutOrder = queryWithoutOrder.replace(/WHERE\s+.+$/i, '').trim();
  queryWithoutOrder = queryWithoutOrder.replace(/;\s*$/, '');
  let whereClause = '';
  
  switch(dateFilter.type) {
    case 'today':
    case 'yesterday':
    case 'specific_date':
      whereClause = ` WHERE DATE(${dateColumn}) = '${dateFilter.date || dateFilter.startDate}'`;
      break;
      
    case 'this_week':
    case 'this_month':
    case 'last_month':
    case 'this_year':
    case 'date_range':
      whereClause = ` WHERE ${dateColumn} >= '${dateFilter.startDate}' AND ${dateColumn} <= '${dateFilter.endDate}'`;
      break;
  }
  
  // Gabungkan query
  let finalQuery = queryWithoutOrder + whereClause;
  const orderByMatch = baseQuery.match(/ORDER BY(.+)$/i);
  if (orderByMatch) {
    finalQuery += ` ORDER BY${orderByMatch[1]}`;
  } else {
    finalQuery += ` ORDER BY ${dateColumn} DESC`;
  }
  
  finalQuery = finalQuery.replace(/;\s*;/, ';').trim();
  if (!finalQuery.endsWith(';')) {
    finalQuery += ';';
  }
  
  console.log(`🔧 Query setelah filter: ${finalQuery.substring(0, 200)}...`);
  return finalQuery;
}

function formatDateForDisplay(dateFilter) {
  if (!dateFilter) return '';
  
  switch(dateFilter.type) {
    case 'today':
      return `Hari Ini (${format(new Date(), 'dd/MM/yyyy')})`;
    case 'yesterday':
      return `Kemarin (${format(new Date(dateFilter.date || dateFilter.startDate), 'dd/MM/yyyy')})`;
    case 'this_week':
      return `Minggu Ini (${format(new Date(dateFilter.startDate), 'dd/MM')} - ${format(new Date(dateFilter.endDate), 'dd/MM/yyyy')})`;
    case 'this_month':
      return `Bulan Ini (${format(new Date(dateFilter.startDate), 'MMMM yyyy', { locale: idLocale })})`;
    case 'last_month':
      return `Bulan Lalu (${format(new Date(dateFilter.startDate), 'MMMM yyyy', { locale: idLocale })})`;
    case 'specific_date':
      return format(new Date(dateFilter.date || dateFilter.startDate), 'dd/MM/yyyy');
    case 'date_range':
      return `${format(new Date(dateFilter.startDate), 'dd/MM/yyyy')} - ${format(new Date(dateFilter.endDate), 'dd/MM/yyyy')}`;
    case 'all_time':
      return 'Semua Waktu';
    default:
      return dateFilter.display || '';
  }
}

// =======================================
// HELPER FUNCTIONS FOR FOREIGN KEY RESOLUTION
// =======================================

async function resolveForeignKeysForTable(supabase, rows, tableName) {
  if (!rows || rows.length === 0) return rows;
  
  const enhancedRows = [...rows];
  const fkConfig = getForeignKeyConfig(tableName);
  
  for (const config of fkConfig) {
    await resolveSingleForeignKey(supabase, enhancedRows, config);
  }
  return enhancedRows;
}

function getForeignKeyConfig(tableName) {
  const tableLower = tableName.toLowerCase();
  const configs = {
    'invoices': [
      { fkField: 'customer_id', refTable: 'customers', idField: 'customer_id', nameField: 'name', outputField: 'customer_name' }
    ],
    'deals': [
      { fkField: 'customer_id', refTable: 'customers', idField: 'customer_id', nameField: 'name', outputField: 'customer_name' },
      { fkField: 'company_id', refTable: 'companies', idField: 'company_id', nameField: 'company_name', outputField: 'company_name' }
    ],
    'tickets': [
      { fkField: 'customer_id', refTable: 'customers', idField: 'customer_id', nameField: 'name', outputField: 'customer_name' },
      { fkField: 'assigned_to', refTable: 'users', idField: 'user_id', nameField: 'name', outputField: 'assigned_name' }
    ],
    'activities': [
      { fkField: 'assigned_to', refTable: 'users', idField: 'user_id', nameField: 'name', outputField: 'assigned_name'}
    ],
    'teams': [
      { fkField: 'manager_id', refTable: 'users', idField: 'user_id', nameField: 'name', outputField: 'manager_name'}
    ],
    'customers': [
      { fkField: 'pic_id', refTable: 'users', idField: 'user_id', nameField: 'name', outputField: 'pic_name'}
    ],
    'services': [
      { fkField: 'customer_id', refTable: 'customers', idField: 'customer_id', nameField: 'name', outputField: 'customer_name' }
    ],
    
    'service_cctv': [
      { fkField: 'service_id', refTable: 'services', idField: 'service_id', nameField: 'service_name', outputField: 'service_name' }
    ],
    
    'service_sip_trunk': [
      { fkField: 'service_id', refTable: 'services', idField: 'service_id', nameField: 'service_name', outputField: 'service_name' }
    ],
    
    'service_cloud': [
      { fkField: 'service_id', refTable: 'services', idField: 'service_id', nameField: 'service_name', outputField: 'service_name' }
    ]
  };
  
  for (const [key, config] of Object.entries(configs)) {
    if (tableLower.includes(key) || key.includes(tableLower)) {
      return config;
    }
  }
  
  return [];
}

async function resolveSingleForeignKey(supabase, rows, config) {
  const { fkField, refTable, nameField, outputField } = config;
  
  // 🔒 HARD MAP PRIMARY KEY (ANTI ERROR)
  const primaryKeyMap = {
    users: 'user_id',
    customers: 'customer_id',
    invoices: 'invoice_id',
    deals: 'deal_id',
    tickets: 'ticket_id',
    companies: 'company_id',
    teams: 'team_id',
    products: 'product_id'
  };

  const primaryKey = primaryKeyMap[refTable];

  if (!primaryKey) {
    console.warn(`⚠️ Unknown primary key for table ${refTable}`);
    return;
  }

  const uniqueIds = [...new Set(
    rows.map(row => row[fkField]).filter(Boolean)
  )];

  if (uniqueIds.length === 0) return;

  console.log(`🔍 Resolving FK ${fkField} → ${refTable}.${primaryKey}`);

  const { data, error } = await supabase
    .from(refTable)
    .select(`${primaryKey}, ${nameField}`)
    .in(primaryKey, uniqueIds);

  if (error) {
    console.error(`❌ Error fetching ${refTable}:`, error.message);
    return;
  }

  const idToName = new Map();
  data.forEach(item => {
    idToName.set(
      item[primaryKey],
      item[nameField] || `ID: ${item[primaryKey]}`
    );
  });

  rows.forEach(row => {
    const id = row[fkField];
    row[outputField] = idToName.get(id) || (id ? `ID: ${id}` : '-');
  });
}

// Fungsi helper untuk formatting berdasarkan tabel
function formatTableData(enhancedRows, tableName) {
  let formattedRows = [];
  let formattedHeaders = [];
  
  const tableLower = tableName.toLowerCase();
  
  // Format khusus berdasarkan nama tabel
  if (tableLower.includes('ticket')) {
    formattedRows = enhancedRows.map((item, index) => ({
      'No': index + 1,
      'ID': item.id || item.ticket_id || '-',
      'Masalah': item.issue_type || item.issue || '-',
      'Status': item.status || '-',
      'Prioritas': item.priority || '-',
      'Ditugaskan ke': item.assigned_name || '-',
      'Pelanggan': item.customer_name || '-',
      'Tanggal Dibuat': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm') : '-'
    }));
    formattedHeaders = ['No', 'ID', 'Masalah', 'Status', 'Prioritas', 'Ditugaskan ke', 'Pelanggan', 'Tanggal Dibuat'];
  }
  else if (tableLower.includes('invoice')) {
    formattedRows = enhancedRows.map((item, index) => ({
      'No': index + 1,
      'Nomor Invoice': item.id || item.invoice_id || '-',
      'Pelanggan': item.customer_name || '-',
      'Jumlah': item.amount ? `Rp ${Number(item.amount).toLocaleString('id-ID')}` : '-',
      'Status': item.status || '-',
      'Tanggal Jatuh Tempo': item.due_date ? format(new Date(item.due_date), 'dd/MM/yyyy') : '-',
      'Dibuat': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'
    }));
    formattedHeaders = ['No', 'Nomor Invoice', 'Pelanggan', 'Jumlah', 'Status', 'Tanggal Jatuh Tempo', 'Dibuat'];
  }
  else if (tableLower.includes('service')) {
    // Format khusus untuk service tables
    if (tableLower.includes('cctv')) {
      formattedRows = enhancedRows.map((item, index) => ({
        'No': index + 1,
        'ID': item.id || '-',
        'Service ID': item.service_id || '-',
        'User Account': item.user_account || '-',
        'Password': item.password || '-',
        'Serial No': item.serial_no || '-',
        'Encryption Code': item.encryption_code || '-',
        'Mobile App User': item.user_mobile_app || '-',
        'Mobile App Password': item.pwd_mobile_app || '-'
      }));
      formattedHeaders = ['No', 'ID', 'Service ID', 'User Account', 'Password', 'Serial No', 'Encryption Code', 'Mobile App User', 'Mobile App Password'];
    }
    else if (tableLower.includes('trunk') || tableLower.includes('sip')) {
      formattedRows = enhancedRows.map((item, index) => ({
        'No': index + 1,
        'ID': item.id || '-',
        'Service ID': item.service_id || '-',
        'User ID Phone': item.user_id_phone || '-',
        'Password': item.password || '-',
        'SIP Server': item.sip_server || '-'
      }));
      formattedHeaders = ['No', 'ID', 'Service ID', 'User ID Phone', 'Password', 'SIP Server'];
    }
    else if (tableLower.includes('cloud')) {
      formattedRows = enhancedRows.map((item, index) => ({
        'No': index + 1,
        'ID': item.id || '-',
        'Service ID': item.service_id || '-',
        'User Email': item.user_email || '-',
        'Password': item.password || '-',
        'Provider': item.provider || '-'
      }));
      formattedHeaders = ['No', 'ID', 'Service ID', 'User Email', 'Password', 'Provider'];
    }
    else {
      // Default service formatting
      formattedRows = enhancedRows.map((item, index) => ({
        'No': index + 1,
        'ID': item.id || item.service_id || '-',
        'Tipe': item.service_type || '-',
        'Pelanggan': item.customer_name || '-',
        'Status': item.status || '-',
        'Tanggal Aktif': item.start_date ? format(new Date(item.start_date), 'dd/MM/yyyy') : '-',
        'Tanggal Pesanan': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'
      }));
      formattedHeaders = ['No', 'ID', 'Tipe', 'Pelanggan', 'Status', 'Tanggal Aktif', 'Tanggal Pesanan'];
    }
  }
  else if (tableLower.includes('deal')) {
    formattedRows = enhancedRows.map((item, index) => ({
      'No': index + 1,
      'ID': item.id || item.deal_id || '-',
      'Nama Deal': item.deal_name || item.name || '-',
      'Pelanggan': item.customer_name || '-',
      'Perusahaan': item.company_name || '-',
      'Nilai': item.deal_value ? `Rp ${Number(item.deal_value).toLocaleString('id-ID')}` : '-',
      'Tahapan': item.deal_stage || item.stage || '-',
      'Dibuat': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-',
      'Tanggal Tenggat': item.expected_close_date ? format(new Date(item.expected_close_date), 'dd/MM/yyyy') : '-'
    }));
    formattedHeaders = ['No', 'ID', 'Nama Deal', 'Pelanggan', 'Perusahaan', 'Nilai', 'Tahapan', 'Dibuat', 'Tanggal Tenggat'];
  }
  else if (tableLower.includes('team')) {
    formattedRows = enhancedRows.map((item, index) => ({
      'No': index + 1,
      'ID': item.id || item.team_id || '-',
      'Nama Tim': item.team_name || item.name || '-',
      'Manager': item.manager_name || '-',
      'Dibuat': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'
    }));
    formattedHeaders = ['No', 'ID', 'Nama Tim', 'Manager', 'Dibuat'];
  }
  else if (tableLower.includes('customer') || tableLower.includes('pelanggan')) {
    formattedRows = enhancedRows.map((item, index) => ({
      'No': index + 1,
      'ID': item.id || item.customer_id || '-',
      'Nama': item.name || item.nama || '-',
      'Email': item.email || '-',
      'Telepon': item.phone || item.telepon || '-',
      'Alamat': (item.address || item.alamat || '').substring(0, 50),
      'PIC': item.pic_name  || item.pic_id || '-',
      'Dibuat': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'
    }));
    formattedHeaders = ['No', 'ID', 'Nama', 'Email', 'Telepon', 'Alamat', 'PIC', 'Dibuat'];
  }
  else if (tableLower.includes('product') || tableLower.includes('produk')) {
    formattedRows = enhancedRows.map((item, index) => ({
      'No': index + 1,
      'ID': item.id || item.product_id || '-',
      'Nama Produk': item.product_name || item.name || '-',
      'Harga': item.price ? `Rp ${Number(item.price).toLocaleString('id-ID')}` : '-',
      'Deskripsi': (item.description || item.deskripsi || '').substring(0, 50),
      'Dibuat': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'
    }));
    formattedHeaders = ['No', 'ID', 'Nama Produk', 'Harga', 'Deskripsi', 'Dibuat'];
  }
  else {
    // Default formatting (jika tidak ada mapping khusus)
    if (enhancedRows.length > 0) {
      const sampleRow = enhancedRows[0];
      const rawHeaders = Object.keys(sampleRow);
      
      // Filter out unwanted columns
      const filteredHeaders = rawHeaders.filter(header => 
        !['manager_id', 'customer_id', 'assigned_to', 'user_id', 'pic_id'].includes(header.toLowerCase())
      );
      
      // Format headers
      formattedHeaders = ['No', ...filteredHeaders.map(header => 
        header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      )];
      
      // Format rows
      formattedRows = enhancedRows.map((row, index) => {
        const formattedRow = { 'No': index + 1 };
        
        filteredHeaders.forEach(header => {
          const value = row[header];
          let formattedValue = value;
          
          // Format dates
          if (header.includes('date') || header.includes('created') || header.includes('timestamp')) {
            if (value) {
              try {
                formattedValue = format(new Date(value), 'dd/MM/yyyy HH:mm');
              } catch (e) {
                formattedValue = value;
              }
            } else {
              formattedValue = '-';
            }
          }
          
          // Format currency
          if ((header.includes('amount') || header.includes('price') || header.includes('value')) && 
              !isNaN(value) && value !== null && value !== '') {
            formattedValue = `Rp ${Number(value).toLocaleString('id-ID')}`;
          }
          
          // Format boolean
          else if (typeof value === 'boolean') {
            formattedValue = value ? 'Ya' : 'Tidak';
          }
          
          // Handle null/undefined
          else if (value === null || value === undefined || value === '') {
            formattedValue = '-';
          }
          
          // Potong teks panjang
          else if (typeof value === 'string' && value.length > 100) {
            formattedValue = value.substring(0, 100) + '...';
          }
          
          formattedRow[formattedHeaders[filteredHeaders.indexOf(header) + 1]] = formattedValue || '-';
        });
        
        return formattedRow;
      });
    }
  }
  
  return { formattedRows, formattedHeaders };
}

export async function POST(req) {
  try {
    // Ambil data dari body request
    const body = await req.json();
    const { type, parameters, rawQuery } = body; // tambah rawQuery untuk parsing

    if (!type) {
      return NextResponse.json({ error: "Type required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // =======================================
    // 0️⃣ MODE REKAP SEMUA / KESELURUHAN
    // =======================================
    const keywordsRekap = [
      "rekap semua",
      "rekap_semua",
      "laporan keseluruhan",
      "pdf rekap semua",
      "rekap keseluruhan",
      "full rekap",
      "export semua",
      "full dump",
      "export keseluruhan",
      "semua data",
      "full report"
    ];

    const typeMsg = String(type).toLowerCase().trim();
    const isRekap = keywordsRekap.some((k) => typeMsg.includes(k));

    if (isRekap) {
      console.log("⚡ Membuat PDF rekap keseluruhan (Landscape)...");

      // ============================================
      // 1. DAFTAR TABEL YANG AKAN DIPROSES (HARDCODE)
      // ============================================
      const tables = [
        "products", "customers", "invoices", "deals", 
        "tickets", "services", "campaigns", "leads",
        "companies", "activities", "communications", "teams"
      ];

      console.log(`📋 Processing ${tables.length} tables:`, tables);

      // ============================================
      // 2. INISIALISASI PDF
      // ============================================
      const doc = new jsPDF({ orientation: "landscape" });
      
      const tanggal = format(getWIB(), "d MMMM yyyy, HH.mm", {
        locale: idLocale,
      });

      // Header Dokumen
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`Laporan Rekap Keseluruhan`, 14, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Dibuat pada: ${tanggal}`, 14, 28);
      doc.text(`Total Tabel: ${tables.length}`, 14, 35);
      doc.line(14, 40, 280, 40);

      let currentY = 50;
      let totalRecords = 0;
      let processedTables = 0;

      // ============================================
      // 3. LOOP UNTUK SETIAP TABEL
      // ============================================
      for (const table of tables) {
        try {
          console.log(`📊 Processing table: ${table}`);
          
          // Page break jika diperlukan
          if (currentY > 170) {
            doc.addPage();
            currentY = 30;
            
            // Header untuk halaman baru
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text(`Laporan Rekap Keseluruhan (Lanjutan)`, 14, currentY);
            currentY += 15;
          }

          // Judul Tabel
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text(`Tabel: ${table.toUpperCase()}`, 14, currentY);
          currentY += 7;

          // ============================================
          // 4. QUERY LANGSUNG KE TABEL DENGAN DATE FILTER (REVISI AMAN)
          // ============================================
          let rows = [];
          let error = null;

          try {
            let queryBuilder = supabase
              .from(table)
              .select("*");

            // ⭐ DATE FILTER ⭐
            if (parameters?.dateFilter) {
              const { type, date, startDate, endDate, column } = parameters.dateFilter;
              const dateColumn = column || "created_at";

              switch (type) {
                case "today":
                case "yesterday":
                case "specific_date":
                  queryBuilder = queryBuilder.eq(dateColumn, date || startDate);
                  break;

                case "this_week":
                case "this_month":
                case "last_month":
                case "this_year":
                case "date_range":
                  queryBuilder = queryBuilder
                    .gte(dateColumn, startDate)
                    .lte(dateColumn, endDate);
                  break;
              }
            }

            queryBuilder = queryBuilder.limit(100);

            // ============================
            // ORDER BY LOGIC (ANTI ERROR)
            // ============================

            // mapping primary key per tabel
            const primaryKeyMap = {
              customers: "customer_id",
              invoices: "invoice_id",
              deals: "deal_id",
              tickets: "ticket_id",
              products: "product_id",
              users: "user_id",
              teams: "team_id",
              companies: "company_id"
            };

            const primaryKey = primaryKeyMap[table];

            // 1️⃣ Coba order by created_at
            let result = await queryBuilder.order("created_at", { ascending: false });

            // 2️⃣ Jika gagal, coba primary key yang BENAR
            if (result.error && primaryKey) {
              console.warn(`⚠️ created_at gagal di ${table}, coba ${primaryKey}`);
              result = await queryBuilder.order(primaryKey, { ascending: false });
            }

            // 3️⃣ Jika masih gagal, TANPA order (AMAN)
            if (result.error) {
              console.warn(`⚠️ Order gagal di ${table}, fetch tanpa order`);
              const fallback = await queryBuilder;
              if (fallback.error) throw fallback.error;
              rows = fallback.data || [];
            } else {
              rows = result.data || [];
            }

          } catch (fetchError) {
            error = fetchError;
            console.warn(`⚠️ Could not fetch table ${table}:`, fetchError.message);
          }

          // ============================================
          // 5. HANDLE HASIL QUERY
          // ============================================
          if (error) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "italic");
            doc.text(`(Tabel tidak ditemukan atau error: ${error.message.substring(0, 60)})`, 14, currentY);
            currentY += 10;
            continue;
          }

          if (!rows || rows.length === 0) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "italic");
            doc.text("(Tabel kosong)", 14, currentY);
            currentY += 10;
            continue;
          }

          console.log(`✅ Table ${table}: ${rows.length} rows`);
          

          let enhancedRows = rows;
          if (['invoices','deals','tickets','activities','teams','customers'].some(t => table.toLowerCase().includes(t))) {
            try {
              enhancedRows = await resolveForeignKeysForTable(supabase, rows, table);
              console.log(`🔗 Resolved foreign keys for ${table}`);
            } catch (fkError) {
              console.warn(`⚠️ Failed to resolve foreign keys for ${table}:`, fkError.message);
              // Tetap gunakan rows asli jika gagal
              enhancedRows = rows;
            }
          }

          processedTables++;
          totalRecords += rows.length;

          // ============================================
          // 6. FORMAT DATA UNTUK TABEL SPESIFIK
          // ============================================
          const { formattedRows, formattedHeaders } = formatTableData(enhancedRows, table);

          console.log(`🔍 DEBUG: Table ${table}`);
          console.log(`🔍 formattedHeaders:`, formattedHeaders);
          console.log(`🔍 formattedRows[0] keys:`, Object.keys(formattedRows[0] || {}));
          console.log(`🔍 formattedRows[0] values:`, formattedRows[0]);

          // Cek apakah semua header ada di row
          if (formattedRows.length > 0) {
            const sampleRow = formattedRows[0];
            formattedHeaders.forEach(header => {
              if (!sampleRow.hasOwnProperty(header)) {
                console.warn(`⚠️ Header "${header}" tidak ditemukan di row!`);
              }
            });
          }
          // ============================================
          // 7. RENDER TABLE KE PDF
          // ============================================
          if (formattedRows.length > 0 && formattedHeaders.length > 0) {
            // PERBAIKAN: Gunakan headers yang telah diformat untuk mengambil data
            const bodyData = formattedRows.map(row => {
              return formattedHeaders.map(header => {
                // Cek apakah row memiliki properti ini
                if (row.hasOwnProperty(header)) {
                  return row[header] || '-';
                } else {
                  // Jika tidak, coba cari dengan nama yang mirip (case insensitive)
                  const foundKey = Object.keys(row).find(key => 
                    key.toLowerCase() === header.toLowerCase()
                  );
                  return foundKey ? row[foundKey] || '-' : '-';
                }
              });
            });
            
            // Column width logic
            const columnStyles = {};
            formattedHeaders.forEach((header, index) => {
              const h = header.toLowerCase();
              
              if (h === 'no') {columnStyles[index] = { cellWidth: 15, halign: 'center' };
            }
              else if (h.includes('id')) columnStyles[index] = { cellWidth: 25 };
              else if (h.includes('date') || h.includes('dibuat') || h.includes('created')) columnStyles[index] = { cellWidth: 25 };
              else if (h.includes('name') || h.includes('nama')) columnStyles[index] = { cellWidth: 40 };
              else if (h.includes('email')) columnStyles[index] = { cellWidth: 45 };
              else if (h.includes('amount') || h.includes('price') || h.includes('value') || h.includes('harga')) columnStyles[index] = { cellWidth: 35 };
              else if (h.includes('status')) columnStyles[index] = { cellWidth: 20 };
              else columnStyles[index] = { cellWidth: 30 };
            });

            
            autoTable(doc, {
              startY: currentY,
              head: [formattedHeaders],
              body: bodyData,
              theme: "striped",
              styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: "linebreak",
                halign: "left",
              },
              headStyles: {
                fillColor: [52, 152, 219],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
              },
              columnStyles: columnStyles,
              margin: { left: 14, right: 14 },
              tableWidth: 'wrap'
            });

            currentY = doc.lastAutoTable.finalY + 12;
            
            // Info jumlah record
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.text(`*Total: ${rows.length} record`, 14, currentY);
            currentY += 6;
          }

        } catch (tableError) {
          console.error(`Table ${table} processing error:`, tableError);
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.text(`Error processing: ${tableError.message.substring(0, 60)}`, 14, currentY);
          currentY += 10;
        }
      }

      // ============================================
      // 8. SUMMARY PAGE
      // ============================================
      if (processedTables > 0) {
        if (currentY > 150) {
          doc.addPage();
          currentY = 30;
        }
        
        // ⭐⭐ PERBAIKAN: HAPUS EMOJI, GUNAKAN TEKS BIASA ⭐⭐
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(`RINGKASAN LAPORAN`, 14, currentY);
        currentY += 15;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Total Tabel Diproses: ${processedTables} dari ${tables.length}`, 14, currentY);
        currentY += 7;
        doc.text(`Total Record: ${totalRecords}`, 14, currentY);
        currentY += 7;
        doc.text(`Tanggal Generate: ${tanggal}`, 14, currentY);
        
        if (parameters && parameters.dateFilter) {
          const periodDisplay = formatDateForDisplay(parameters.dateFilter);
          currentY += 7;
          doc.text(`Periode: ${periodDisplay}`, 14, currentY);
        }
      }

      // ============================================
      // 9. SAVE PDF
      // ============================================
      const pdfBytes = doc.output("arraybuffer");
      const fileName = `rekap-keseluruhan-${Date.now()}.pdf`;

      try {
        // Cek dulu apakah storage bucket tersedia
        const { data: buckets, error: bucketError } = await supabase.storage
          .from("pdf-reports")
          .list();

        if (bucketError) {
          console.error("❌ Storage bucket error:", bucketError);
          
          // FALLBACK 1: Return PDF sebagai base64
          const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
          
          return NextResponse.json({ 
            success: true,
            pdfBase64: pdfBase64,
            fileName: fileName,
            preset: "full_rekap",
            description: "Laporan Rekap Keseluruhan",
            totalData: totalRecords,
            tableCount: processedTables,
            note: "PDF dikembalikan sebagai base64 karena storage tidak tersedia",
            timestamp: new Date().toISOString()
          });
        }

        // Upload ke Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("pdf-reports")
          .upload(fileName, pdfBytes, { 
            contentType: "application/pdf",
            upsert: true
          });

        if (uploadError) {
          console.error("❌ Upload error:", uploadError);
          
          // FALLBACK 2: Simpan ke local filesystem (development only)
          if (process.env.NODE_ENV === 'development') {
            const fs = await import('fs/promises');
            const path = await import('path');
            
            try {
              const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
              await fs.mkdir(uploadsDir, { recursive: true });
              
              const filePath = path.join(uploadsDir, fileName);
              await fs.writeFile(filePath, Buffer.from(pdfBytes));
              
              const localUrl = `/uploads/${fileName}`;
              
              return NextResponse.json({ 
                success: true,
                url: localUrl,
                preset: "full_rekap",
                description: "Laporan Rekap Keseluruhan",
                totalData: totalRecords,
                tableCount: processedTables,
                note: "PDF disimpan lokal (development mode)",
                timestamp: new Date().toISOString()
              });
            } catch (fsError) {
              console.error("❌ Local save error:", fsError);
              // Lanjut ke fallback base64
            }
          }
          
          // FALLBACK 3: Return base64
          const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
          
          return NextResponse.json({ 
            success: true,
            pdfBase64: pdfBase64,
            fileName: fileName,
            preset: "full_rekap",
            description: "Laporan Rekap Keseluruhan",
            totalData: totalRecords,
            tableCount: processedTables,
            note: "PDF dikembalikan sebagai base64",
            timestamp: new Date().toISOString()
          });
        }

        // Get public URL jika upload berhasil
        const { data: publicUrl } = supabase.storage
          .from("pdf-reports")
          .getPublicUrl(fileName);

        console.log(`✅ PDF saved successfully: ${fileName}`);

        return NextResponse.json({ 
          success: true, // PASTIKAN ADA INI!
          url: publicUrl.publicUrl,
          preset: "full_rekap",
          description: "Laporan Rekap Keseluruhan",
          totalData: totalRecords,
          tableCount: processedTables,
          timestamp: new Date().toISOString()
        });

      } catch (storageErr) {
        console.error("❌ Storage error:", storageErr);
        
        // Ultimate fallback
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
        
        return NextResponse.json({ 
          success: true,
          pdfBase64: pdfBase64,
          fileName: fileName,
          preset: "full_rekap",
          description: "Laporan Rekap Keseluruhan",
          totalData: totalRecords,
          tableCount: processedTables,
          note: "PDF sebagai base64 (fallback)",
          timestamp: new Date().toISOString()
        });
      }
    }

    // =======================================
    // 1️⃣ MODE QUERY PRESET (TABEL SPESIFIK)
    // =======================================

    let preset;
    
    const { data: presets } = await supabase
      .from("queries_preset")
      .select("intent, description, query, keywords")
      .or(`intent.ilike.%${type}%,keywords.ilike.%${type}%`)
      .limit(5);

    if (!presets || presets.length === 0) {
      console.log(`❌ Preset not found for: ${type}, using dynamic query...`);
      
      // FALLBACK: Buat query dinamis berdasarkan nama tabel
      const tableName = type.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/list$/, '')
        .replace(/s$/, '');
      
      // Cek apakah tabel ada
      const { data: tableCheck } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', tableName)
        .single();
      
      if (tableCheck) {
        preset = {
          intent: type,
          description: `Daftar ${tableName.charAt(0).toUpperCase() + tableName.slice(1)}`,
          query: `SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT 100`
        };
        console.log(`✅ Created dynamic preset for table: ${tableName}`);
      } else {
        // Coba tabel umum
        const commonTables = ['products', 'customers', 'invoices', 'deals', 'tickets', 'services'];
        const foundTable = commonTables.find(t => type.toLowerCase().includes(t));
        
        if (foundTable) {
          preset = {
            intent: type,
            description: `Daftar ${foundTable.charAt(0).toUpperCase() + foundTable.slice(1)}`,
            query: `SELECT * FROM ${foundTable} ORDER BY created_at DESC LIMIT 100`
          };
          console.log(`✅ Using common table: ${foundTable}`);
        } else {
          // Default ke products
          preset = {
            intent: type,
            description: "Daftar Produk",
            query: "SELECT * FROM products ORDER BY created_at DESC LIMIT 100"
          };
          console.log(`🔄 Using default table: products`);
        }
      }
    } else {
      preset = presets[0];
      console.log(`📊 Found preset: ${preset.intent} - ${preset.description}`);
    }
    
    
    // =======================================
    // PROCESS QUERY DENGAN PARAMETER
    // =======================================
    let finalQuery = preset.query;
    
    // Handle jika query berupa JSON
    if (finalQuery.startsWith('{') && finalQuery.endsWith('}')) {
      try {
        const queryObj = JSON.parse(finalQuery);
        const firstKey = Object.keys(queryObj)[0];
        finalQuery = queryObj[firstKey];
        console.log(`📦 Extracted query from JSON: ${firstKey}`);
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
      }
    }
    
    // SIMPLE AND ROBUST PARAMETER REPLACEMENT
    if (parameters && typeof parameters === 'object') {
      // 1. Apply date filter jika ada (PRIORITAS TERTINGGI)
      if (parameters.dateFilter) {
        console.log(`📅 Date filter detected:`, parameters.dateFilter);
        finalQuery = applyDateFilterToQuery(finalQuery, parameters.dateFilter);
      }
      
      // 2. Ganti parameter lainnya (tidak termasuk dateFilter)
      Object.keys(parameters).forEach(key => {
        if (key !== 'dateFilter') {
          const placeholder = `{{${key}}}`;
          const placeholderWithQuotes = `'{{${key}}}'`;
          
          if (finalQuery.includes(placeholder)) {
            finalQuery = finalQuery.replace(new RegExp(placeholder, 'g'), parameters[key]);
          }
          if (finalQuery.includes(placeholderWithQuotes)) {
            finalQuery = finalQuery.replace(new RegExp(placeholderWithQuotes, 'g'), `'${parameters[key]}'`);
          }
        }
      });
    }

    // Clean query - pastikan format benar
    finalQuery = finalQuery.trim();
    
    // HAPUS DOUBLE SEMICOLON
    finalQuery = finalQuery.replace(/;\s*;/, ';');
    
    // Pastikan hanya satu semicolon di akhir
    if (!finalQuery.endsWith(';')) {
      finalQuery += ';';
    }

    console.log(`🚀 Final query: ${finalQuery.substring(0, 150)}...`);

    // =======================================
    // EXECUTE QUERY DENGAN FIX SEMICOLON
    // =======================================
    console.log(`🚀 Executing query: ${finalQuery.substring(0, 100)}...`);
    
    let result;
    let queryError;
    
    try {
      // HAPUS SEMICOLON untuk RPC (penting!)
      const rpcQuery = finalQuery.replace(/;\s*$/, '').trim();
      console.log(`🔄 RPC query (without semicolon): ${rpcQuery.substring(0, 100)}...`);
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc("exec_sql", {
        sql: rpcQuery
      });
      
      if (rpcError) {
        queryError = rpcError;
        console.log(`❌ RPC error: ${rpcError.message}`);
        throw rpcError;
      }
      
      result = rpcResult;
      console.log(`✅ RPC success, got ${result?.length || 0} rows`);
    } catch (rpcError) {
      console.log("RPC failed, trying direct query...", rpcError.message);
      queryError = rpcError;
    }

    // Fallback: direct query jika RPC gagal
    if (queryError || !result) {
      try {
        const tableMatch = finalQuery.match(/from\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          console.log(`🔄 Direct query to table: ${tableName}`);
          
          // Parse WHERE clause sederhana
          let queryBuilder = supabase.from(tableName).select('*');
          
          // Coba parse kondisi WHERE sederhana
          const whereMatch = finalQuery.match(/where\s+(.+?)(?:\s+order\s+by|\s*$)/i);
          if (whereMatch) {
            const whereClause = whereMatch[1];
            console.log(`Parsing WHERE clause: ${whereClause}`);
            
            // Parse date range
            const dateRangeMatch = whereClause.match(/(\w+)\s*>=\s*['"]([^'"]+)['"]\s+and\s+\1\s*<=\s*['"]([^'"]+)['"]/i);
            if (dateRangeMatch) {
              const [, column, startDate, endDate] = dateRangeMatch;
              console.log(`📅 Date range: ${column} from ${startDate} to ${endDate}`);
              queryBuilder = queryBuilder.gte(column, startDate).lte(column, endDate);
            }
            
            // Parse equality
            const eqMatch = whereClause.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/i);
            if (eqMatch && !dateRangeMatch) {
              queryBuilder = queryBuilder.eq(eqMatch[1], eqMatch[2]);
            }
          }
          
          // Order by
          const orderMatch = finalQuery.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
          if (orderMatch) {
            const orderCol = orderMatch[1];
            const orderDir = (orderMatch[2] || 'asc').toLowerCase();
            queryBuilder = queryBuilder.order(orderCol, { ascending: orderDir === 'asc' });
          } else {
            // Default order by created_at desc
            queryBuilder = queryBuilder.order('created_at', { ascending: false });
          }
          
          // Limit jika ada
          const limitMatch = finalQuery.match(/limit\s+(\d+)/i);
          if (limitMatch) {
            queryBuilder = queryBuilder.limit(parseInt(limitMatch[1]));
          } else {
            queryBuilder = queryBuilder.limit(100); // Default limit
          }
          
          const { data: directResult, error: directError } = await queryBuilder;
          
          if (directError) {
            throw directError;
          }
          
          result = directResult;
          console.log(`✅ Direct query success, got ${result?.length || 0} rows`);
        }
      } catch (directError) {
        console.error("Direct query also failed:", directError);
        // Lanjutkan dengan result kosong
        result = [];
      }
    }

    if (!result) {
      result = [];
    }

    // ⭐⭐ TAMBAHKAN FOREIGN KEY RESOLUTION DI SINI ⭐⭐
  let enhancedResult = result;
  if (['invoices', 'deals', 'tickets', 'activities', 'teams', 'customers']
    .some(t => preset.intent.toLowerCase().includes(t) || preset.description.toLowerCase().includes(t))) {
    try {
      enhancedResult = await resolveForeignKeysForTable(supabase, result, preset.intent);
      console.log(`🔗 Resolved foreign keys for preset: ${preset.intent}`);
    } catch (fkError) {
      console.warn(`⚠️ Failed to resolve foreign keys:`, fkError.message);
    }
  }

    // =======================================
    // GENERATE PDF
    // =======================================
    const doc = new jsPDF({ orientation: "landscape" });

    const tanggal = format(getWIB(), "d MMMM yyyy, HH.mm", {
      locale: idLocale,
    });

    // Header dengan periode jika ada
    let headerTitle = preset.description;
    let periodDisplay = '';
    
    if (parameters?.dateFilter) {
      periodDisplay = formatDateForDisplay(parameters.dateFilter);
      headerTitle += ` - ${periodDisplay}`;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(headerTitle, 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Query: ${preset.intent}`, 14, 28);
    doc.text(`Dibuat pada: ${tanggal}`, 14, 34);

    // Info periode jika ada
    if (parameters?.dateFilter) {
      doc.text(`Periode: ${parameters.dateFilter.display}`, 14, 40);
      doc.line(14, 44, 280, 44);
    } else {
      doc.line(14, 38, 280, 38);
    }

    // =======================================
    // SMART TABLE RENDERING DENGAN FORMATTING YANG KONSISTEN
    // =======================================
    const startY = parameters && Object.keys(parameters).length > 0 ? 50 : 45;

    if (Array.isArray(enhancedResult) && enhancedResult.length > 0) {
      // ⭐⭐ GUNAKAN FUNGSI FORMATTING YANG SAMA DENGAN MODE REKAP
      const { formattedRows, formattedHeaders } = formatTableData(enhancedResult, preset.intent);
      
      console.log(`🔍 DEBUG MODE QUERY PRESET:`);
      console.log(`🔍 Preset intent: ${preset.intent}`);
      console.log(`🔍 Formatted headers:`, formattedHeaders);
      console.log(`🔍 Formatted rows sample:`, formattedRows[0]);
      
      // Buat body data untuk PDF
      const bodyData = formattedRows.map(row => 
        formattedHeaders.map(header => row[header] || '-')
      );
      
      // Column width logic
      const columnStyles = {};
      const pageWidth = doc.internal.pageSize.width;
      const margin = 14;
      const availableWidth = pageWidth - (2 * margin);
      let totalWidth = 0;
      
      formattedHeaders.forEach((header, index) => {
        const h = header.toLowerCase();
        let cellWidth;
        
        if (h === 'no') {
          cellWidth = 15;
        }
        else if (h.includes('id') || h === 'uuid') {
          cellWidth = 25;
        } 
        else if (h.includes('tanggal') || h.includes('date') || h.includes('dibuat') || h.includes('created')) {
          cellWidth = 35;
        }
        else if (h.includes('nama') || h.includes('name')) {
          cellWidth = 40;
        }
        else if (h.includes('email')) {
          cellWidth = 50;
        }
        else if (h.includes('harga') || h.includes('price') || h.includes('jumlah') || 
                h.includes('amount') || h.includes('total') || h.includes('value')) {
          cellWidth = 40;
        }
        else if (h.includes('telepon') || h.includes('phone')) {
          cellWidth = 35;
        }
        else if (h.includes('status')) {
          cellWidth = 25;
        }
        else if (h.includes('deskripsi') || h.includes('description') || 
                h.includes('catatan') || h.includes('notes')) {
          cellWidth = 60;
        }
        else {
          cellWidth = 30;
        }
        
        columnStyles[index] = { cellWidth };
        totalWidth += cellWidth;
      });
      
      // Adjust width jika terlalu lebar
      if (totalWidth > availableWidth) {
        const ratio = availableWidth / totalWidth;
        formattedHeaders.forEach((_, index) => {
          columnStyles[index].cellWidth *= ratio;
          columnStyles[index].cellWidth = Math.max(columnStyles[index].cellWidth, 20);
        });
      }
      
      // Generate table
      autoTable(doc, {
        startY: startY,
        head: [formattedHeaders],
        body: bodyData,
        theme: "grid",
        styles: {
          fontSize: enhancedResult.length > 30 ? 7 : 8,
          cellPadding: 3,
          overflow: "linebreak",
          halign: "left",
          valign: "middle"
        },
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: columnStyles,
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        didDrawPage: function (data) {
          // Footer
          doc.setFontSize(8);
          doc.setTextColor(128);
          doc.text(
            `Halaman ${data.pageNumber} - Total Data: ${enhancedResult.length}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        }
      });
    } else {
      doc.setFontSize(12);
      doc.text("Tidak ada data ditemukan.", 14, startY);
    }

    // =======================================
    // SAVE & RETURN URL DENGAN STRUCTURE YANG BENAR
    // =======================================
    const pdfBytes = doc.output("arraybuffer");
    
    // Generate filename dengan filter info
    const filterSuffix = parameters?.dateFilter ? `-${parameters.dateFilter.type}` : '';
    const fileName = `laporan-${preset.intent}${filterSuffix}-${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("pdf-reports")
      .upload(fileName, pdfBytes, { contentType: "application/pdf" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({
        success: false,
        error: "Gagal mengupload PDF",
        detail: uploadError.message
      }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from("pdf-reports")
      .getPublicUrl(fileName);

    return NextResponse.json({ 
      success: true, // PENTING: Tambahkan success flag
      url: publicUrl.publicUrl,
      preset: preset.intent,
      description: preset.description,
      period: periodDisplay,
      totalData: result.length || 0,
      queryInfo: {
        filtered: !!parameters?.dateFilter,
        periodType: parameters?.dateFilter?.type,
        dateColumn: parameters?.dateFilter?.column
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ PDF Error:", err);
    return NextResponse.json(
      { 
        success: false, // PENTING: Tambahkan success flag
        error: "Gagal membuat PDF",
        detail: err.message,
        suggestion: "Coba dengan query yang lebih sederhana atau periode berbeda",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Optional: Tambahkan GET untuk testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "PDF Generator API is running",
    endpoints: {
      POST: "/api/pdf-generate",
      parameters: {
        type: "query intent or 'rekap semua'",
        parameters: "optional parameters including dateFilter",
        rawQuery: "optional raw text for smart date parsing"
      }
    },
    timestamp: new Date().toISOString()
  });
}