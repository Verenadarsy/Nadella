import { generateEmbedding } from "../../../utils/ai/embedding";
import { semanticSearch } from "../../../utils/ai/semanticSearch";
import { askAI } from "../../../utils/ai/askAI";
import { detectTargetTable } from "../../../utils/ai/router";
import { extractFilters } from "../../../utils/ai/filters";
import { detectStrategy } from "../../../utils/ai/detectStrategy";
import { supabase } from "@/lib/supabaseClient";
import { 
  formatDataForAI, 
  getSourceId, 
  applyDateOrdering,
  applyPriceOrdering 
} from "../../../utils/ai/queryHelper";

export async function POST(req) {
  try {
    const { question } = await req.json();
    
    if (!question || question.trim() === "") {
      return Response.json({
        question: "",
        answer: "Pertanyaan tidak boleh kosong 😊",
        sources: [],
        type: "error"
      });
    }

    console.log("\n=== PROCESSING QUESTION ===");
    console.log("Question:", question);

    // Get detection results
    const table = detectTargetTable(question);
    const strategy = detectStrategy(question);
    const filters = extractFilters(question);

    console.log("Detection Results:", { table, strategy, filters });

    // =====================
    // HANDLE NON-DATA QUERIES FIRST
    // =====================
    if (strategy === "greeting") {
      return Response.json({
        question,
        answer: await askAI(question, null, { responseType: "greeting" }),
        sources: [],
        type: "greeting"
      });
    }

    if (strategy === "general") {
      return Response.json({
        question,
        answer: await askAI(question, null, { responseType: "general" }),
        sources: [],
        type: "general"
      });
    }

    if (strategy === "chat") {
      return Response.json({
        question,
        answer: await askAI(question, null, { responseType: "chat" }),
        sources: [],
        type: "chat"
      });
    }

    // =====================
    // HANDLE DATA QUERIES
    // =====================
    
    // Safety check
    if (!table || typeof table !== 'string') {
      return Response.json({
        question,
        answer: await askAI(
          question, 
          null, 
          { responseType: "chat", customPrompt: "User bertanya sesuatu yang tidak jelas tentang data. Minta klarifikasi." }
        ),
        sources: [],
        type: "error"
      });
    }

    // Blacklist tables yang tidak boleh diakses
    const blacklistedTables = ["users", "ai_embeddings", "ai_embeddings_v2", "queries_preset"];
    if (blacklistedTables.includes(table)) {
      return Response.json({
        question,
        answer: `Maaf, data "${table}" tidak dapat diakses.`,
        sources: [],
        type: "error"
      });
    }

    return await handleDataQuery(table, question, strategy, filters);

  } catch (error) {
    console.error("Fatal error:", error);
    return Response.json({
      question: question || "Unknown",
      answer: "Maaf, terjadi kesalahan sistem. Silakan coba lagi dengan pertanyaan yang lebih spesifik.",
      sources: [],
      type: "error"
    });
  }
}

// Helper function untuk handle data queries
async function handleDataQuery(table, question, strategy, filters) {
  console.log(`\n=== HANDLING DATA QUERY: ${table} ===`);
  
  // Validasi: pastikan tabel ada
  try {
    const { error: tableCheckError } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .limit(1);

    if (tableCheckError) {
      console.error(`Table "${table}" not found:`, tableCheckError);
      return Response.json({
        question,
        answer: `Maaf, data "${table}" tidak ditemukan. Coba tanyakan tentang data lain.`,
        sources: [],
        type: "error"
      });
    }
  } catch (err) {
    console.error("Table validation error:", err);
  }

  // =====================
  // BUILD QUERY
  // =====================
  let query = supabase.from(table).select("*");
  let hasDateFilter = false;
  let hasSpecialFilter = false;

  // ---------- DATE FILTERS ----------
  if (strategy === "filter_today") {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Coba berbagai kolom tanggal
    try {
      query = query.gte("created_at", todayStr + "T00:00:00");
      query = query.lt("created_at", tomorrowStr + "T00:00:00");
    } catch (e) {
      try {
        query = query.gte("date", todayStr + "T00:00:00");
        query = query.lt("date", tomorrowStr + "T00:00:00");
      } catch (e2) {
        try {
          query = query.gte("start_date", todayStr);
          query = query.lt("start_date", tomorrowStr);
        } catch (e3) {
          console.log("No date column found for today filter");
        }
      }
    }
    hasDateFilter = true;
    console.log("Applied today filter");
  }

  if (strategy === "filter_yesterday") {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const today = new Date();
    
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    // Coba berbagai kolom tanggal
    try {
      query = query.gte("created_at", yesterdayStr + "T00:00:00");
      query = query.lt("created_at", todayStr + "T00:00:00");
    } catch (e) {
      try {
        query = query.gte("date", yesterdayStr + "T00:00:00");
        query = query.lt("date", todayStr + "T00:00:00");
      } catch (e2) {
        console.log("No date column found for yesterday filter");
      }
    }
    hasDateFilter = true;
    console.log("Applied yesterday filter");
  }

  // ---------- TABLE-SPECIFIC FILTERS ----------
  console.log("Applying filters:", filters);
  
  // Helper untuk apply filter dengan berbagai nama kolom
  const applyFilter = (query, possibleColumns, value) => {
    for (const col of possibleColumns) {
      try {
        return query.ilike(col, `%${value}%`);
      } catch (e) {
        continue;
      }
    }
    return query;
  };

  // Filter untuk semua tabel
  if (filters.status) {
    const statusColumns = {
      "deals": ["deal_stage"],
      "tickets": ["status"],
      "customers": ["status"],
      "invoices": ["status"],
      "services": ["status"],
      "leads": ["lead_status"],
      "activities": ["type"], // activities pakai type
      "campaigns": ["channel"], // campaigns pakai channel
      "default": ["status", "stage", "type", "channel"]
    };
    
    const columns = statusColumns[table] || statusColumns.default;
    query = applyFilter(query, columns, filters.status);
    hasSpecialFilter = true;
  }

  if (filters.priority && table === "tickets") {
    query = query.eq("priority", filters.priority);
    hasSpecialFilter = true;
  }

  if (filters.deal_stage && table === "deals") {
    query = query.ilike("deal_stage", `%${filters.deal_stage}%`);
    hasSpecialFilter = true;
  }

  if (filters.min_value && (table === "deals" || table === "invoices" || table === "campaigns")) {
    const valueColumns = {
      "deals": "deal_value",
      "invoices": "amount",
      "campaigns": "budget"
    };
    const col = valueColumns[table];
    if (col) query = query.gte(col, filters.min_value);
  }

  if (filters.max_value && (table === "deals" || table === "invoices" || table === "campaigns")) {
    const valueColumns = {
      "deals": "deal_value",
      "invoices": "amount",
      "campaigns": "budget"
    };
    const col = valueColumns[table];
    if (col) query = query.lte(col, filters.max_value);
  }

  if (filters.min_price && table === "products") {
    query = query.gte("price", filters.min_price);
    hasSpecialFilter = true;
  }

  if (filters.max_price && table === "products") {
    query = query.lte("price", filters.max_price);
    hasSpecialFilter = true;
  }

  // ---------- STRATEGY-BASED ORDERING & LIMITS ----------
  console.log("Applying strategy:", strategy);
  
  if (strategy === "count") {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    // Format count response
    const answer = await askAI(
      question,
      JSON.stringify({
        table: table,
        count: count || 0,
        filters: Object.keys(filters).length > 0 ? filters : null
      }),
      { 
        responseType: "data",
        customPrompt: "User menanyakan jumlah data. Berikan jawaban berdasarkan informasi jumlah data yang tersedia."
      }
    );
    
    return Response.json({
      question,
      answer,
      sources: [],
      type: "count"
    });
  }

  // Apply ordering based on strategy
  if (strategy === "latest") {
    query = applyDateOrdering(query, table, "desc");
    query = query.limit(5);
  } 
  else if (strategy === "oldest") {
    query = applyDateOrdering(query, table, "asc");
    query = query.limit(5);
  } 
  else if (strategy === "cheapest") {
    query = applyPriceOrdering(query, table, "cheapest");
    query = query.limit(1);
  } 
  else if (strategy === "expensive") {
    query = applyPriceOrdering(query, table, "expensive");
    query = query.limit(1);
  } 
  else if (strategy === "semantic") {
    // Untuk semantic queries, gunakan vector search
    return await handleSemanticQuery(table, question);
  }
  else {
    // Default untuk list queries
    query = applyDateOrdering(query, table, "desc");
    query = query.limit(hasDateFilter || hasSpecialFilter ? 20 : 10);
  }

  // =====================
  // EXECUTE QUERY
  // =====================
  console.log("Executing query...");
  const { data, error } = await query;

  if (error) {
    console.error("Query error:", error);
    return Response.json({
      question,
      answer: await askAI(
        question, 
        null, 
        { 
          responseType: "chat",
          customPrompt: "Terjadi kesalahan teknis saat mengambil data. Minta maaf dan sarankan untuk mencoba lagi."
        }
      ),
      sources: [],
      type: "error"
    });
  }

  console.log(`Found ${data?.length || 0} records`);

  // =====================
  // RESOLVE FOREIGN KEYS (NEW!)
  // =====================
  let enhancedData = data;
  if (data && data.length > 0) {
    try {
      enhancedData = await resolveForeignKeysForTable(supabase, data, table);
      console.log("✅ Foreign keys resolved for AI query");
    } catch (fkError) {
      console.warn("⚠️ Foreign key resolution failed:", fkError.message);
      // Continue with original data if FK resolution fails
    }
  }

  // =====================
  // FORMAT RESPONSE
  // =====================
  if (!data || data.length === 0) {
    const answer = await askAI(
      question,
      JSON.stringify({ table, filters, strategy }),
      { 
        responseType: "data",
        customPrompt: "Tidak ada data yang ditemukan berdasarkan kriteria tersebut. Sampaikan dengan sopan dan tawarkan alternatif."
      }
    );
    
    return Response.json({
      question,
      answer,
      sources: [],
      type: "no_data"
    });
  }

  // Format data untuk AI menggunakan helper function
  const formattedData = formatDataForAI(data, table);
  
  const answer = await askAI(
    question,
    JSON.stringify(formattedData),
    { 
      responseType: "data",
      temperature: 0.1
    }
  );

  return Response.json({
    question,
    answer,
    sources: data.slice(0, 5).map(d => ({
      source_table: table,
      source_id: getSourceId(d, table)  // Gunakan helper function
    })),
    type: "data"
  });
}

// Helper untuk semantic queries
async function handleSemanticQuery(table, question) {
  console.log("Handling semantic query...");
  
  try {
    const embedding = await generateEmbedding(question);
    const results = await semanticSearch(embedding, 5, {
      source_table: table
    });

    if (!results || results.length === 0) {
      const answer = await askAI(
        question,
        null,
        { 
          responseType: "chat",
          customPrompt: "Tidak ditemukan informasi yang relevan untuk pertanyaan tersebut."
        }
      );
      
      return Response.json({
        question,
        answer,
        sources: [],
        type: "no_data"
      });
    }

    const context = results
      .map((r, i) => `[${i + 1}] ${r.content}`)
      .join("\n\n");

    const answer = await askAI(question, context, { responseType: "data" });

    return Response.json({
      question,
      answer,
      sources: results.map(r => ({
        source_table: r.source_table,
        source_id: r.source_id
      })),
      type: "semantic"
    });
    
  } catch (error) {
    console.error("Semantic search error:", error);
    return Response.json({
      question,
      answer: "Maaf, terjadi kesalahan saat mencari informasi.",
      sources: [],
      type: "error"
    });
  }
}

// =====================
// FOREIGN KEY RESOLUTION FUNCTIONS
// =====================

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
    'teams': [
      { fkField: 'manager_id', refTable: 'users', idField: 'user_id', nameField: 'name', outputField: 'manager_name'}
    ],
    'tickets': [
      { fkField: 'customer_id', refTable: 'customers', idField: 'customer_id', nameField: 'name', outputField: 'customer_name' },
      { fkField: 'assigned_to', refTable: 'users', idField: 'user_id', nameField: 'name', outputField: 'assigned_name' }
    ],
    'customers': [
      { fkField: 'pic_id', refTable: 'users', idField: 'user_id', nameField: 'name', outputField: 'pic_name'},
      { fkField: 'company_id', refTable: 'companies', idField: 'company_id', nameField: 'company_name', outputField: 'company_name' },
    ],
    'deals': [
      { fkField: 'customer_id', refTable: 'customers', idField: 'customer_id', nameField: 'name', outputField: 'customer_name' },
      { fkField: 'company_id', refTable: 'companies', idField: 'company_id', nameField: 'company_name', outputField: 'company_name' }
    ],
    'invoices': [
      { fkField: 'customer_id', refTable: 'customers', idField: 'customer_id', nameField: 'name', outputField: 'customer_name' }
    ],
    'activities': [
      { fkField: 'assigned_to', refTable: 'users', idField: 'user_id', nameField: 'name', outputField: 'assigned_name'}
    ],
    'services': [
      { fkField: 'customer_id', refTable: 'customers', idField: 'customer_id', nameField: 'name', outputField: 'customer_name' }
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
  const { fkField, refTable, idField, nameField, outputField } = config;
  
  const uniqueIds = [...new Set(
    rows.map(row => row[fkField]).filter(Boolean)
  )];

  if (uniqueIds.length === 0) return;

  console.log(`🔍 Resolving FK ${fkField} → ${refTable}.${idField}`);

  try {
    const { data, error } = await supabase
      .from(refTable)
      .select(`${idField}, ${nameField}`)
      .in(idField, uniqueIds);

    if (error) {
      console.error(`❌ Error fetching ${refTable}:`, error.message);
      return;
    }

    const idToName = new Map();
    data.forEach(item => {
      idToName.set(
        item[idField],
        item[nameField] || `ID: ${item[idField]}`
      );
    });

    rows.forEach(row => {
      const id = row[fkField];
      row[outputField] = idToName.get(id) || (id ? `ID: ${id}` : '-');
    });
  } catch (error) {
    console.warn(`⚠️ FK resolution failed for ${fkField}:`, error.message);
  }
}