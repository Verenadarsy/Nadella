"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";
import { useLanguage } from '@/lib/languageContext';

export default function CustomerChart({ dark }) {
  const { language, t } = useLanguage();
  const texts = t.charts[language];

  const [data, setData] = useState([]);

  // Helper function to translate month
  const translateMonth = (month) => {
    const monthMap = {
      'january': texts.jan,
      'february': texts.feb,
      'march': texts.mar,
      'april': texts.apr,
      'may': texts.mayShort,
      'june': texts.jun,
      'july': texts.jul,
      'august': texts.aug,
      'september': texts.sep,
      'october': texts.oct,
      'november': texts.nov,
      'december': texts.dec,
      // Support short format from API
      'jan': texts.jan,
      'feb': texts.feb,
      'mar': texts.mar,
      'apr': texts.apr,
      'jun': texts.jun,
      'jul': texts.jul,
      'aug': texts.aug,
      'sep': texts.sep,
      'oct': texts.oct,
      'nov': texts.nov,
      'dec': texts.dec
    };
    return monthMap[month.toLowerCase()] || month;
  };

  useEffect(() => {
    fetch("/api/dashboard/chart/customer")
      .then(res => res.json())
      .then(rows => {
        const formatted = rows.map(r => ({
          month: r.month,
          monthTranslated: translateMonth(r.month),
          count: r.count
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
          <p className="font-semibold mb-1">{payload[0].payload.monthTranslated}</p>
          <p className="text-sm">
            {texts.newCustomers}: <span className="font-bold text-blue-500">
              {payload[0].value}
            </span> {texts.customers}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Tick for XAxis
  const CustomXAxisTick = ({ x, y, payload }) => {
    const item = data.find(d => d.month === payload.value);
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill={dark ? '#9ca3af' : '#6b7280'}
          fontSize={12}
        >
          {item?.monthTranslated || payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className={`p-4 rounded-xl shadow ${dark ? "bg-slate-800" : "bg-white"}`}>
      <h3 className={`font-semibold mb-3 ${dark ? "text-white" : "text-slate-800"}`}>
        {texts.customerGrowth}
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={dark ? '#374151' : '#e5e7eb'}
          />
          <XAxis
            dataKey="month"
            tick={<CustomXAxisTick />}
            stroke={dark ? '#9ca3af' : '#6b7280'}
          />
          <YAxis
            stroke={dark ? '#9ca3af' : '#6b7280'}
            style={{ fontSize: '12px' }}
            allowDecimals={false}        // ⬅️ INI PENTING
            tickFormatter={(value) => Math.round(value)} // ⬅️ Format biar integer
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}