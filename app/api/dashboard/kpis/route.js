import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    console.log("Mulai mengambil data KPI...");

    // 1. Hitung Total Customers
    const { count: totalCustomers, error: errCust } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (errCust) console.error("Error Customers:", errCust);

    // 2. Hitung Deals Won (Total Value)
    const { data: dealsData, error: errDeals } = await supabase
      .from('deals')
      .select('deal_value')
      .eq('deal_stage', 'won');

    if (errDeals) console.error("Error Deals:", errDeals);

    const dealsWon = dealsData?.reduce((acc, curr) => acc + (curr.deal_value || 0), 0) || 0;

    // 2b. Ambil Won Deals dengan customer_id
    const { data: wonDealsRaw, error: errWonDeals } = await supabase
      .from('deals')
      .select('deal_name, deal_value, customer_id')
      .eq('deal_stage', 'won')
      .order('deal_value', { ascending: false })
      .limit(10);

    console.log("Won Deals Raw:", wonDealsRaw);
    if (errWonDeals) console.error("Won Deals Error:", errWonDeals);

    // 2c. Ambil semua customers untuk mapping
    let wonDealsData = [];
    if (wonDealsRaw && wonDealsRaw.length > 0) {
      // Filter customer_id yang valid (tidak null/undefined)
      const customerIds = [...new Set(
        wonDealsRaw.map(d => d.customer_id).filter(id => id != null)
      )];

      console.log("Customer IDs to fetch:", customerIds);

      // Ambil data customers berdasarkan ID
      let customerMap = {};
      if (customerIds.length > 0) {
        const { data: customers, error: errCustomers } = await supabase
          .from('customers')
          .select('customer_id, name')  // ✅ UBAH dari 'customer_name' ke 'name'
          .in('customer_id', customerIds);

        console.log("Customers fetched:", customers);
        if (errCustomers) console.error("Error fetching customers:", errCustomers);

        // Buat mapping customer_id -> name
        if (customers && customers.length > 0) {
          customers.forEach(c => {
            customerMap[c.customer_id] = c.name;  // ✅ Gunakan c.name
          });
        }
      }

      console.log("Customer Map:", customerMap);

      // Gabungkan data deals dengan customer names
      wonDealsData = wonDealsRaw.map(deal => ({
        deal_name: deal.deal_name,
        deal_value: deal.deal_value,
        customer_name: deal.customer_id
          ? (customerMap[deal.customer_id] || 'Unknown Customer')
          : 'No Customer'
      }));
    }

    console.log("Final Won Deals Data:", wonDealsData);

    // 3. Hitung Open Tickets
    const { count: openTickets, error: errTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    if (errTickets) console.error("Error Tickets:", errTickets);

    // 4. Hitung Active Services
    const { count: activeServices, error: errServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (errServices) console.error("Error Services:", errServices);

    // Cek Error KRITIS
    if (errCust || errDeals || errTickets || errServices) {
      console.error("Error Database Kritis!");
      return NextResponse.json({
        error: "Gagal koneksi ke database",
        details: { errCust, errDeals, errTickets, errServices }
      }, { status: 500 });
    }

    // Return response
    return NextResponse.json({
      totalCustomers: totalCustomers || 0,
      dealsWon: dealsWon || 0,
      openTickets: openTickets || 0,
      activeServices: activeServices || 0,
      wonDealsData: wonDealsData.map(deal => ({
        dealName: deal.deal_name,
        customerName: deal.customer_name,
        amount: deal.deal_value || 0
      }))
    });

  } catch (error) {
    console.error("Critical Error:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}