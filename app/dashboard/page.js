"use client";
import { useState, useEffect } from "react";
import FloatingChat from "./floatingchat";
import KpiCard from "./kpicard";
import CustomerChart from "./components/customerchart";
import DealsStageChart from "./components/dealstagechart";
import TicketChart from "./components/ticketchart";
import ActivityChart from "./components/activitychart";
import SectionLoader from "./components/sectionloader";
import { useLanguage } from '@/lib/languageContext'

export default function DashboardHome() {
  const { language, t } = useLanguage()
  const texts = t.dashboard[language]
  const [darkMode, setDarkMode] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(true);
        const res = await fetch("/api/dashboard/kpis");
        const data = await res.json();
        setKpis(data);
      } catch (error) {
        console.error("Error fetching KPIs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
  <div className="p-6 max-w-7xl mx-auto relative space-y-6">
    {/* Banner */}
    <div
      className={`rounded-xl p-8 shadow-xl text-white ${
        darkMode
          ? "bg-gradient-to-r from-blue-600 to-blue-800"
          : "bg-gradient-to-r from-blue-900 to-blue-700"
      }`}
    >
      <h1 className="text-3xl font-bold mb-2">{texts.welcomeBack}</h1>
      <p className="text-blue-100">
        {texts.bannerSubtitle}
      </p>
    </div>

    {/* Overview + Won Deals Table */}
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
          {texts.dashboardOverview}
        </h2>
        <p className={`${darkMode ? "text-slate-400" : "text-slate-600"}`}>
          {texts.overviewSubtitle}
        </p>
      </div>

      {/* SECTION LOADER */}
      {loading ? (
        <SectionLoader darkMode={darkMode} text="Loading dashboard data..." />
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Customers"
              value={kpis?.totalCustomers || 0}
              dark={darkMode}
            />
            <KpiCard
              title="Deals Won"
              value={`Rp ${(kpis?.dealsWon || 0).toLocaleString('id-ID')}`}
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

          {/* WON DEALS TABLE */}
          <div className="mt-6">
            <h3
              className={`text-lg font-bold mb-3 ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
            >
              {texts.wonDeals}
            </h3>

            <div className={`overflow-hidden rounded-lg border ${
              darkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                <table className="w-full">
                  <thead className={`sticky top-0 ${
                    darkMode ? "bg-slate-700" : "bg-gray-100"
                  }`}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-sm font-semibold ${
                        darkMode ? "text-slate-200" : "text-slate-700"
                      }`}>
                        {texts.dealName}
                      </th>
                      <th className={`px-4 py-3 text-left text-sm font-semibold ${
                        darkMode ? "text-slate-200" : "text-slate-700"
                      }`}>
                        {texts.customer}
                      </th>
                      <th className={`px-4 py-3 text-right text-sm font-semibold ${
                        darkMode ? "text-slate-200" : "text-slate-700"
                      }`}>
                        {texts.amount}
                      </th>
                      <th className={`px-4 py-3 text-center text-sm font-semibold ${
                        darkMode ? "text-slate-200" : "text-slate-700"
                      }`}>
                        {texts.status}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpis?.wonDealsData?.length > 0 ? (
                      kpis.wonDealsData.map((deal, index) => (
                        <tr
                          key={index}
                          className={`border-b ${
                            darkMode ? "border-slate-700 hover:bg-slate-700/50" : "border-gray-200 hover:bg-gray-50"
                          } transition-colors`}
                        >
                          <td className={`px-4 py-3 text-sm ${
                            darkMode ? "text-slate-300" : "text-slate-700"
                          }`}>
                            {deal.dealName}
                          </td>
                          <td className={`px-4 py-3 text-sm ${
                            darkMode ? "text-slate-300" : "text-slate-700"
                          }`}>
                            {deal.customerName}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-medium ${
                            darkMode ? "text-green-400" : "text-green-600"
                          }`}>
                            Rp {deal.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {texts.won}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className={`px-4 py-8 text-center text-sm ${
                          darkMode ? "text-slate-400" : "text-slate-500"
                        }`}>
                          {texts.noWonDeals}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>

    {/* CHART SECTION */}
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