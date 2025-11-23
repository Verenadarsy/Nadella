"use client";
import { useState, useEffect } from "react";
import FloatingChat from "./floatingchat";
import KpiCard from "./kpicard";
import CustomerChart from "./components/customerchart";
import DealsStageChart from "./components/dealstagechart";
import TicketChart from "./components/ticketchart";
import ActivityChart from "./components/activitychart";
import SectionLoader from "./components/sectionloader"; 

export default function DashboardHome() {
  const [darkMode, setDarkMode] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ LOADING STATE

  // Detect dark mode globally
  useEffect(() => {
    const updateDark = () =>
      setDarkMode(document.documentElement.classList.contains("dark"));

    updateDark();
    const observer = new MutationObserver(updateDark);
    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // Fetch Dashboard KPIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // ✅ START LOADING
        const res = await fetch("/api/dashboard/kpis");
        const data = await res.json();
        setKpis(data);
      } catch (error) {
        console.error("Error fetching KPIs:", error);
      } finally {
        setLoading(false); // ✅ STOP LOADING
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto relative space-y-6">
      {/* ✅ Banner - GA KELOAD */}
      <div
        className={`rounded-xl p-8 shadow-xl text-white ${
          darkMode
            ? "bg-gradient-to-r from-blue-600 to-blue-800"
            : "bg-gradient-to-r from-blue-900 to-blue-700"
        }`}
      >
        <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-blue-100">
          Manage your CRM system efficiently from this dashboard
        </p>
      </div>

      {/* ✅ Overview + KPI Cards - YANG KELOAD */}
      <div
        className={`rounded-xl p-6 shadow-lg space-y-6 ${
          darkMode ? "bg-slate-800" : "bg-white"
        }`}
      >
        <div>
          <h2
            className={`text-xl font-bold mb-2 ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Dashboard Overview
          </h2>
          <p className={`${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Select a menu from the sidebar to get started managing your CRM
            system.
          </p>
        </div>

        {/* ✅ SECTION LOADER - CUMA KPI CARDS */}
        {loading ? (
          <SectionLoader darkMode={darkMode} text="Loading dashboard data..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <KpiCard
              title="Total Customers"
              value={kpis?.totalCustomers || 0}
              dark={darkMode}
            />
            <KpiCard
              title="Deals Won"
              value={kpis?.dealsWon || 0}
              dark={darkMode}
            />
            <KpiCard
              title="Open Tickets"
              value={kpis?.openTickets || 0}
              dark={darkMode}
            />
            <KpiCard
              title="Active Services"
              value={kpis?.activeServices || 0}
              dark={darkMode}
            />
          </div>
        )}
      </div>

      {/* ✅ CHART SECTION - YANG KELOAD */}
      {loading ? (
        <div
          className={`rounded-xl p-6 shadow-lg ${
            darkMode ? "bg-slate-800" : "bg-white"
          }`}
        >
          <SectionLoader darkMode={darkMode} text="Loading charts..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart - Customers */}
          <CustomerChart dark={darkMode} />

          {/* Pie Chart - Deals */}
          <DealsStageChart dark={darkMode} />

          {/* Bar Chart - Tickets */}
          <TicketChart dark={darkMode} />

          {/* Donut Chart - Activities */}
          <ActivityChart dark={darkMode} />
        </div>
      )}

      {/* Floating Chat */}
      <FloatingChat />
    </div>
  );
}