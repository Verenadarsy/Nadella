import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Helper: Parse dan apply date filter ke query
function applyDateFilterToQuery(baseQuery, dateFilter) {
  if (!dateFilter || !baseQuery) return baseQuery;
  
  console.log(`📅 Applying date filter: ${dateFilter.display}`);
  
  // Cari kolom tanggal yang tepat
  let dateColumn = dateFilter.column || 'created_at';
  if (!dateColumn && baseQuery.includes('tanggal_dibuat')) dateColumn = 'tanggal_dibuat';
  else if (!dateColumn && baseQuery.includes('tanggal')) dateColumn = 'tanggal';
  else if (!dateColumn && baseQuery.includes('date')) dateColumn = 'date';
  
  console.log(`📍 Using date column: ${dateColumn}`);
  
  // Hapus ORDER BY clause sementara untuk memudahkan
  let queryWithoutOrder = baseQuery.replace(/ORDER BY.*$/i, '').trim();
  
  // Hapus WHERE clause yang ada (jika ada)
  queryWithoutOrder = queryWithoutOrder.replace(/WHERE\s+.+$/i, '').trim();
  
  // Hapus semicolon di akhir
  queryWithoutOrder = queryWithoutOrder.replace(/;\s*$/, '');
  
  // Tambahkan WHERE clause berdasarkan tipe filter
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
  
  // Tambahkan ORDER BY kembali jika ada di original query
  const orderByMatch = baseQuery.match(/ORDER BY(.+)$/i);
  if (orderByMatch) {
    finalQuery += ` ORDER BY${orderByMatch[1]}`;
  } else {
    // Default order by date column desc
    finalQuery += ` ORDER BY ${dateColumn} DESC`;
  }
  
  // Hapus semicolon ganda dan pastikan hanya satu
  finalQuery = finalQuery.replace(/;\s*;/, ';').trim();
  if (!finalQuery.endsWith(';')) {
    finalQuery += ';';
  }
  
  console.log(`🔧 Query setelah filter: ${finalQuery.substring(0, 200)}...`);
  return finalQuery;
}

// Helper: Format date untuk display di PDF
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
      
      const tanggal = format(new Date(), "d MMMM yyyy, HH.mm", {
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
          // 4. QUERY LANGSUNG KE TABEL DENGAN DATE FILTER
          // ============================================
          let rows = [];
          let error = null;

          try {
            // Buat base query
            let queryBuilder = supabase
              .from(table)
              .select("*");
            
            // ⭐⭐ PASANG FILTER TANGGAL JIKA ADA ⭐⭐
            if (parameters && parameters.dateFilter) {
              console.log(`📅 Applying date filter to ${table}:`, parameters.dateFilter);
              
              const dateFilter = parameters.dateFilter;
              const dateColumn = dateFilter.column || 'created_at';
              
              // Berdasarkan tipe filter
              switch(dateFilter.type) {
                case 'today':
                case 'yesterday':
                case 'specific_date':
                  queryBuilder = queryBuilder.eq(
                    dateColumn,
                    dateFilter.date || dateFilter.startDate
                  );
                  break;
                  
                case 'this_week':
                case 'this_month':
                case 'last_month':
                case 'this_year':
                case 'date_range':
                  queryBuilder = queryBuilder
                    .gte(dateColumn, dateFilter.startDate)
                    .lte(dateColumn, dateFilter.endDate);
                  break;
                  
                // 'all_time' tidak perlu filter
              }
            }
            
            // Tambahkan limit dan order
            queryBuilder = queryBuilder.limit(100);
            
            // Coba order by created_at, jika gagal coba id
            try {
              const { data, error: orderError } = await queryBuilder.order("created_at", { ascending: false });
              
              if (orderError) {
                // Fallback: order by id
                const { data: altData, error: altError } = await queryBuilder.order("id", { ascending: false });
                
                if (altError) {
                  // Fallback: tanpa order
                  const { data: simpleData, error: simpleError } = await queryBuilder;
                  if (simpleError) throw simpleError;
                  rows = simpleData || [];
                } else {
                  rows = altData || [];
                }
              } else {
                rows = data || [];
              }
            } catch (orderErr) {
              // Final fallback: query tanpa order
              const { data, error } = await queryBuilder;
              if (!error) rows = data || [];
              else throw error;
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
          
          processedTables++;
          totalRecords += rows.length;

          // ============================================
          // 6. FORMAT DATA UNTUK TABEL SPESIFIK
          // ============================================
          let formattedRows = rows;
          let formattedHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];
          
          // Format khusus berdasarkan nama tabel
          switch(table.toLowerCase()) {
            case 'products':
              formattedRows = rows.map(item => ({
                'ID': item.id || item.product_id,
                'Nama Produk': item.product_name || item.name,
                'Harga': item.price ? `Rp ${Number(item.price).toLocaleString('id-ID')}` : '-',
                'Deskripsi': (item.description || item.deskripsi || '').substring(0, 50),
                'Dibuat': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'
              }));
              formattedHeaders = ['ID', 'Nama Produk', 'Harga', 'Deskripsi', 'Dibuat'];
              break;
              
            case 'customers':
              formattedRows = rows.map(item => ({
                'ID': item.id || item.customer_id,
                'Nama': item.name || item.nama,
                'Email': item.email || '-',
                'Telepon': item.phone || item.telepon || '-',
                'Status': item.status || '-',
                'Dibuat': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'
              }));
              formattedHeaders = ['ID', 'Nama', 'Email', 'Telepon', 'Status', 'Dibuat'];
              break;
              
            case 'invoices':
              formattedRows = rows.map(item => ({
                'ID': item.id || item.invoice_id,
                'Customer ID': item.customer_id || '-',
                'Amount': item.amount ? `Rp ${Number(item.amount).toLocaleString('id-ID')}` : '-',
                'Status': item.status || '-',
                'Due Date': item.due_date ? format(new Date(item.due_date), 'dd/MM/yyyy') : '-',
                'Created': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'
              }));
              formattedHeaders = ['ID', 'Customer ID', 'Amount', 'Status', 'Due Date', 'Created'];
              break;
              
            case 'deals':
              formattedRows = rows.map(item => ({
                'ID': item.id || item.deal_id,
                'Deal Name': item.deal_name || item.name,
                'Customer ID': item.customer_id || '-',
                'Value': item.deal_value ? `Rp ${Number(item.deal_value).toLocaleString('id-ID')}` : '-',
                'Stage': item.deal_stage || '-',
                'Created': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'
              }));
              formattedHeaders = ['ID', 'Deal Name', 'Customer ID', 'Value', 'Stage', 'Created'];
              break;
              
            case 'tickets':
              formattedRows = rows.map(item => ({
                'ID': item.id || item.ticket_id,
                'Issue': item.issue_type || item.issue || '-',
                'Status': item.status || '-',
                'Priority': item.priority || '-',
                'Assigned To': item.assigned_to || '-',
                'Created': item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy') : '-'
              }));
              formattedHeaders = ['ID', 'Issue', 'Status', 'Priority', 'Assigned To', 'Created'];
              break;
              
            default:
              // Format default: ubah snake_case ke Title Case
              if (rows.length > 0) {
                const sampleRow = rows[0];
                formattedHeaders = Object.keys(sampleRow).map(key => 
                  key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                );
                
                formattedRows = rows.map(row => {
                  const formatted = {};
                  Object.keys(row).forEach((key, idx) => {
                    const value = row[key];
                    let formattedValue = value;
                    
                    // Format tanggal
                    if (key.includes('date') || key.includes('created') || key.includes('timestamp')) {
                      if (value) {
                        try {
                          formattedValue = format(new Date(value), 'dd/MM/yyyy');
                        } catch (e) {
                          formattedValue = value;
                        }
                      }
                    }
                    
                    // Format currency
                    if ((key.includes('amount') || key.includes('price') || key.includes('value')) && 
                        !isNaN(value) && value !== '') {
                      formattedValue = `Rp ${Number(value).toLocaleString('id-ID')}`;
                    }
                    
                    formatted[formattedHeaders[idx]] = formattedValue;
                  });
                  return formatted;
                });
              }
              break;
          }

          // ============================================
          // 7. RENDER TABLE KE PDF
          // ============================================
          if (formattedRows.length > 0 && formattedHeaders.length > 0) {
            const bodyData = formattedRows.map(row => 
              formattedHeaders.map(header => row[header] || '-')
            );
            
            // Column width logic
            const columnStyles = {};
            formattedHeaders.forEach((header, index) => {
              const h = header.toLowerCase();
              
              if (h.includes('id')) columnStyles[index] = { cellWidth: 25 };
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
    
    // Cari di queries_preset
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

    // =======================================
    // GENERATE PDF
    // =======================================
    const doc = new jsPDF({ orientation: "landscape" });

    const tanggal = format(new Date(), "d MMMM yyyy, HH.mm", {
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
    // SMART TABLE RENDERING DENGAN WIDTH FIX
    // =======================================
    const startY = parameters && Object.keys(parameters).length > 0 ? 50 : 45;
    
    if (Array.isArray(result) && result.length > 0) {
      const headers = Object.keys(result[0]);
      const rows = result.map(row => Object.values(row));
      
      // Auto column width logic dengan adjustment
      const columnStyles = {};
      const pageWidth = doc.internal.pageSize.width;
      const margin = 14;
      const availableWidth = pageWidth - (2 * margin);
      let totalWidth = 0;
      
      headers.forEach((header, index) => {
        const h = header.toLowerCase();
        let cellWidth;
        
        if (h.includes('id') || h === 'uuid') {
          cellWidth = 25;
        } 
        else if (h.includes('date') || h.includes('tanggal') || h.includes('created') || h.includes('timestamp')) {
          cellWidth = 30;
        }
        else if (h.includes('name') || h.includes('nama')) {
          cellWidth = 40;
        }
        else if (h.includes('email')) {
          cellWidth = 45;
        }
        else if (h.includes('amount') || h.includes('harga') || h.includes('price') || h.includes('value')) {
          cellWidth = 35;
          // Format currency jika angka
          rows.forEach((row, rowIndex) => {
            if (row[index] && !isNaN(row[index]) && row[index] !== null && row[index] !== '') {
              rows[rowIndex][index] = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
              }).format(Number(row[index]));
            }
          });
        }
        else if (h.includes('status')) {
          cellWidth = 20;
        }
        else {
          cellWidth = 30;
        }
        
        columnStyles[index] = { cellWidth };
        totalWidth += cellWidth;
      });
      
      // Adjust jika total width melebihi available width
      if (totalWidth > availableWidth) {
        const ratio = availableWidth / totalWidth;
        headers.forEach((_, index) => {
          columnStyles[index].cellWidth *= ratio;
          columnStyles[index].cellWidth = Math.max(columnStyles[index].cellWidth, 15);
        });
      }

      autoTable(doc, {
        startY: startY,
        head: [headers],
        body: rows,
        theme: "grid",
        styles: {
          fontSize: result.length > 30 ? 7 : 8,
          cellPadding: 2,
          overflow: "linebreak",
          halign: "left",
        },
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255,
          fontStyle: 'bold'
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
            `Halaman ${data.pageNumber} - Total Data: ${result.length}`,
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