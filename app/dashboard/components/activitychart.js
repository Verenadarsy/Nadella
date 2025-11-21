"use client";

import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";

const COLORS = ["#06b6d4", "#8b5cf6", "#f87171", "#34d399"];

export default function ActivityChart({ dark }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/dashboard/chart/activities")
      .then(res => res.json())
      .then(rows => {
        const formatted = rows.map(r => ({
          name: r.type,
          value: r.count
        }));
        setData(formatted);
      });
  }, []);

  return (
    <div className={`p-4 rounded-xl shadow ${dark ? "bg-slate-800" : "bg-white"}`}>
      <h3 className={`font-semibold mb-3 ${dark ? "text-white" : "text-slate-800"}`}>
        Activities Breakdown
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={40} outerRadius={80}>
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
