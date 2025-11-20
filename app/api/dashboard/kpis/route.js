import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
// ----------------------------------------------------

export async function GET() {
  try {
    console.log("Mulai mengambil data KPI...");

    // 1. Hitung Total Customers
    const { count: totalCustomers, error: errCust } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // 2. Hitung Deals Won (Total Value)
    const { data: dealsData, error: errDeals } = await supabase
      .from('deals')
      .select('deal_value')
      .eq('deal_stage', 'won');
    
    // Hitung total duitnya (SUM)
    const dealsWon = dealsData?.reduce((acc, curr) => acc + (curr.deal_value || 0), 0) || 0;

    // 3. Hitung Open Tickets
    const { count: openTickets, error: errTickets } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    // 4. Hitung Active Services
    const { count: activeServices, error: errServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Cek Error
    if (errCust || errDeals || errTickets || errServices) {
      console.error("Error Database:", errCust || errDeals);
      return NextResponse.json({ error: "Gagal koneksi ke database" }, { status: 500 });
    }

    return NextResponse.json({
      totalCustomers: totalCustomers || 0,
      dealsWon: dealsWon || 0,
      openTickets: openTickets || 0,
      activeServices: activeServices || 0
    });

  } catch (error) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}