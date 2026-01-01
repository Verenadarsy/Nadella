export function buildTicketContent(ticket) {
  return `
Jenis data: Ticket Dukungan Pelanggan

Masalah utama:
Ticket ini terkait dengan masalah ${ticket.issue_type} pada produk ${ticket.product_name || 'tidak diketahui'}.

Lokasi pelanggan:
Pelanggan berasal dari wilayah ${ticket.location_city || 'tidak diketahui'}.

Status ticket:
Saat ini ticket berada pada status ${ticket.status} dengan prioritas ${ticket.priority}.

Informasi pelanggan:
Nama pelanggan: ${ticket.customer_name || 'Tidak diketahui'}.

Petugas:
Ticket ditangani oleh ${ticket.assigned_to_name || 'Belum ditugaskan'}.

Waktu pembuatan:
Ticket dibuat pada tanggal ${ticket.created_at}.
`.trim();
}

export function buildCustomerContent(c) {
  return `
Jenis data: Customer
Nama: ${c.name}
Email: ${c.email || "-"}
Status: ${c.status}
Perusahaan: ${c.companies?.company_name || "-"}
Alamat: ${c.address || "-"}
Tanggal dibuat: ${c.created_at}
`.trim();
}

export function buildServiceContent(s) {
  return `
Jenis data: Service
Tipe layanan: ${s.service_type}
Status layanan: ${s.status}
Customer: ${s.customers?.name || "-"}
Tanggal mulai: ${s.start_date}
`.trim();
}

export function buildDealContent(d) {
  return `
Jenis data: Deal
Nama deal: ${d.deal_name}
Stage: ${d.deal_stage}
Nilai: ${d.deal_value}
Customer: ${d.customers?.name || "-"}
Perusahaan: ${d.companies?.company_name || "-"}
Tanggal dibuat: ${d.created_at}
`.trim();
}

export function buildCommunicationContent(c) {
  return `
Jenis data: Communication

Communication ID: ${c.id}
Channel: ${c.channel}
From: ${c.sender}
To: ${c.receiver}
Related Ticket: ${c.ticket_id ?? "N/A"}
Date: ${c.created_at}

Message:
${c.message}
`.trim();
}

export function buildActivityContent(a) {
  return `
Activity type: ${a.type}
Date: ${a.date}
Customer: ${a.customer?.name}
Assigned to: ${a.assigned_to?.name}
Notes: ${a.notes}
`.trim();
}

export function buildProductContent(p) {
  return `
Jenis data: Product

Nama produk:
${p.product_name}

Harga:
${p.price ? `Rp ${p.price}` : "Tidak tersedia"}

Deskripsi produk:
${p.description || "Tidak ada deskripsi"}
`.trim();
}


