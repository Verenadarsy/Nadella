"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { useLanguage } from '@/lib/languageContext';

export default function TicketChart({ dark }) {
  const { language, t } = useLanguage();
  const texts = t.charts[language];

  const [data, setData] = useState([]);

  // Helper function to translate status
  const translateStatus = (status) => {
    const statusMap = {
      'open': texts.open,
      'in progress': texts.inProgress,
      'resolved': texts.resolved,
      'closed': texts.closed
    };
    return statusMap[status.toLowerCase()] || status;
  };

  useEffect(() => {
    fetch("/api/dashboard/chart/ticket")
      .then(res => res.json())
      .then(rows => {
        const formatted = rows.map(r => ({
          status: r.status,
          statusTranslated: translateStatus(r.status),
          total: r.count
        }));
        setData(formatted);
      });
  }, [language]); // 👈 Re-fetch when language changes

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          dark
            ? 'bg-slate-800 border-slate-600 text-white'
            : 'bg-white border-gray-200 text-slate-900'
        }`}>
          <p className="font-semibold">{payload[0].payload.statusTranslated}</p>
          <p className="text-sm">
            {texts.total}: <span className="font-bold text-blue-500">{payload[0].value}</span> {texts.tickets}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-4 rounded-xl shadow ${dark ? "bg-slate-800" : "bg-white"}`}>
      <h3 className={`font-semibold mb-3 ${dark ? "text-white" : "text-slate-800"}`}>
        {texts.ticketsByStatus}
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={dark ? '#374151' : '#e5e7eb'}
          />
          <XAxis
            dataKey="statusTranslated"
            stroke={dark ? '#9ca3af' : '#6b7280'}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke={dark ? '#9ca3af' : '#6b7280'}
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="total"
            fill="#3b82f6"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}