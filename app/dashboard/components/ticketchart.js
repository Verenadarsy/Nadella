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

  useEffect(() => {
    fetch("/api/dashboard/chart/ticket")
      .then(res => res.json())
      .then(rows => {
        const formatted = rows.map(r => ({
          status: r.status,
          total: r.count
        }));
        setData(formatted);
      });
  }, []);

  return (
    <div className={`p-4 rounded-xl shadow ${dark ? "bg-slate-800" : "bg-white"}`}>
      <h3 className={`font-semibold mb-3 ${dark ? "text-white" : "text-slate-800"}`}>
        {texts.ticketsByStatus}
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
