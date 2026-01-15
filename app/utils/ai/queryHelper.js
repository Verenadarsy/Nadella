// utils/ai/queryHelpers.js
export function formatDataForAI(data, table) {
  if (!data || data.length === 0) return { message: "Tidak ada data" };

  const limitedData = data.slice(0, 10);
  
  // Format umum untuk semua tabel
  const formatItem = (item) => {
    const result = {};
    
    // Ambil kolom-kolom penting berdasarkan nama
    for (const [key, value] of Object.entries(item)) {
      // Skip kolom id dan metadata, tapi izinkan foreign keys
      const isPrimaryKey = key === 'id' || key === 'uuid' ||
                          key.endsWith('_id') && !key.includes('_') ||
                          key === table.slice(0, -1) + '_id'; // e.g., 'team_id' for teams table
      
      if (isPrimaryKey) continue;
      if (key.includes('password') || key.includes('hash')) continue;
      
      // Format berdasarkan tipe data
      if (value !== null && value !== undefined) {
        if (typeof value === 'string' && value.length > 100) {
          result[key] = value.substring(0, 100) + '...';
        } else if (key.includes('date') || key.includes('created') || key.includes('timestamp')) {
          try {
            result[key] = new Date(value).toLocaleDateString('id-ID');
          } catch {
            result[key] = value;
          }
        } else if ((key.includes('value') || key.includes('price') || key.includes('amount') || key.includes('budget')) && 
                   typeof value === 'number') {
          result[key] = `Rp ${value.toLocaleString('id-ID')}`;
        } else {
          result[key] = value;
        }
      }
    }
    
    return result;
  };
  
  return {
    table: table,
    count: data.length,
    items: limitedData.map(item => ({
      id: item.id || item[`${table.slice(0, -1)}_id`] || item[`${table}_id`] || "unknown",
      ...formatItem(item)
    }))
  };
}

export function getSourceId(item, table) {
  const idFields = [
    `${table.slice(0, -1)}_id`, // deals -> deal_id
    'id',
    'uuid',
    `${table}_id` // deals -> deals_id
  ];
  
  for (const field of idFields) {
    if (item[field]) return item[field];
  }
  
  // Cari kolom yang mengandung 'id'
  for (const key in item) {
    if (key.toLowerCase().includes('id') && item[key]) {
      return item[key];
    }
  }
  
  return "unknown";
}

export function applyDateOrdering(query, table, direction = "desc") {
  const dateColumns = ["created_at", "date", "created_date", "start_date"];
  for (const col of dateColumns) {
    try {
      return query.order(col, { ascending: direction === "asc" });
    } catch (e) {
      continue;
    }
  }
  return query;
}

export function applyPriceOrdering(query, table, strategy) {
  const priceColumns = ["price", "deal_value", "amount", "budget", "value"];
  const ascending = strategy === "cheapest";
  
  for (const col of priceColumns) {
    try {
      return query.order(col, { ascending });
    } catch (e) {
      continue;
    }
  }
  
  console.log(`⚠️ No price column found for ${table}`);
  return query;
}