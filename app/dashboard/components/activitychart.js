"use client";

import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useLanguage } from '@/lib/languageContext';

const COLORS = ["#06b6d4", "#8b5cf6", "#f87171", "#34d399", "#fbbf24"];

export default function ActivityChart({ dark }) {
  const { language, t } = useLanguage();
  const texts = t.charts[language];

  const [data, setData] = useState([]);

  // Helper function to translate activity type
  const translateActivityType = (type) => {
    const typeMap = {
      'call': texts.call,
      'meeting': texts.meeting,
      'email': texts.email,
      'task': texts.task,
      'note': texts.note,
      'follow-up': texts.followUp
    };
    return typeMap[type.toLowerCase()] || type;
  };

  useEffect(() => {
    fetch("/api/dashboard/chart/activities")
      .then(res => res.json())
      .then(rows => {
        const formatted = rows.map(r => ({
          name: r.type,
          nameTranslated: translateActivityType(r.type),
          value: r.count
        }));
        setData(formatted);
      });
  }, [language]); 

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          dark
            ? 'bg-slate-800 border-slate-600 text-white'
            : 'bg-white border-gray-200 text-slate-900'
        }`}>
          <p className="font-semibold">{payload[0].payload.nameTranslated}</p>
          <p className="text-sm">
            {texts.count}: <span
              className="font-bold"
              style={{ color: payload[0].payload.fill }}
            >
              {payload[0].value}
            </span> {texts.activities}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Legend
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-3 mt-2">
        {payload.map((entry, index) => (
          <li key={`legend-${index}`} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className={dark ? 'text-slate-300' : 'text-slate-700'}>
              {data[index]?.nameTranslated || entry.value}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={`p-4 rounded-xl shadow ${dark ? "bg-slate-800" : "bg-white"}`}>
      <h3 className={`font-semibold mb-3 ${dark ? "text-white" : "text-slate-800"}`}>
        {texts.activitiesBreakdown}
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="nameTranslated"
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            label={({ nameTranslated, percent }) =>
              `${nameTranslated} ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}