// utils/ai/filters.js
export function extractFilters(question) {
  const q = question.toLowerCase();
  const filters = {};

  // ===== STATUS MAPPING PER TABLE =====
  // Untuk deals
  if (q.includes("prospect")) filters.deal_stage = "Prospect";
  if (q.includes("negotiation") || q.includes("negosiasi")) filters.deal_stage = "negotiation";
  if (q.includes("won") || q.includes("menang")) filters.deal_stage = "won";
  if (q.includes("lost") || q.includes("kalah")) filters.deal_stage = "lost";
  
  // Untuk tickets
  if (q.includes("open")) filters.status = "open";
  if (q.includes("in progress") || q.includes("diproses")) filters.status = "in progress";
  if (q.includes("resolved") || q.includes("selesai")) filters.status = "resolved";
  if (q.includes("closed")) filters.status = "closed";
  
  // Untuk invoices
  if (q.includes("pending")) filters.status = "pending";
  if (q.includes("paid") || q.includes("lunas")) filters.status = "paid";
  if (q.includes("overdue") || q.includes("telat")) filters.status = "overdue";

  // ===== PRIORITY =====
  if (q.includes("urgent")) filters.priority = "urgent";
  if (q.includes("high")) filters.priority = "high";
  if (q.includes("medium")) filters.priority = "medium";
  if (q.includes("low")) filters.priority = "low";

  // ===== AMOUNT / VALUE =====
  const amountMatch = q.match(/(?:rp\.?|harga|nilai|value|amount)\s*([0-9.,]+)/i);
  if (amountMatch) {
    const amount = parseFloat(amountMatch[1].replace(/\./g, '').replace(',', '.'));
    if (!isNaN(amount)) {
      if (q.includes("lebih besar") || q.includes(">") || q.includes("diatas")) {
        filters.min_value = amount;
      } else if (q.includes("lebih kecil") || q.includes("<") || q.includes("dibawah")) {
        filters.max_value = amount;
      } else {
        filters.amount = amount;
      }
    }
  }

  // ===== ENTITY TYPE =====
  if (q.includes("deal")) filters.entity_type = "deal";
  if (q.includes("ticket") || q.includes("tiket")) filters.entity_type = "ticket";
  if (q.includes("invoice")) filters.entity_type = "invoice";
  if (q.includes("customer") || q.includes("pelanggan")) filters.entity_type = "customer";
  if (q.includes("product") || q.includes("produk")) filters.entity_type = "product";

  return filters;
}