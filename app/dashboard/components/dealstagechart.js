"use client";

import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";
import { useLanguage } from '@/lib/languageContext';

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444"];

export default function DealsStageChart({ dark }) {
  const { language, t } = useLanguage();
  const texts = t.charts[language];

  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/dashboard/chart/deal_stage")
      .then(res => res.json())
      .then(rows => {
        const formatted = rows.map(r => ({
          name: r.deal_stage,
          value: r.count
        }));
        setData(formatted);
      });
  }, []);

  return (
    <div className={`p-4 rounded-xl shadow ${dark ? "bg-slate-800" : "bg-white"}`}>
      <h3 className={`font-semibold mb-3 ${dark ? "text-white" : "text-slate-800"}`}>
        {texts.dealsByStage}
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={80}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}