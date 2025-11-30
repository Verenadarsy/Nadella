"use client";

import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useLanguage } from '@/lib/languageContext';

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444"];

export default function DealsStageChart({ dark }) {
  const { language, t } = useLanguage();
  const texts = t.charts[language];

  const [rawData, setRawData] = useState([]);

  useEffect(() => {
    fetch("/api/dashboard/chart/deal_stage")
      .then(res => res.json())
      .then(rows => {
        console.log('🔍 RAW API RESPONSE:', rows);
        console.log('🔍 First item:', rows[0]);
        setRawData(rows);
      })
      .catch(err => {
        console.error('❌ Error fetching deal stage data:', err);
      });
  }, []);

  // Helper function to translate deal stage
  const translateDealStage = (stage) => {
    if (!stage) return 'Unknown';

    const stageMap = {
      'prospect': texts?.prospect || 'Prospect',
      'negotiation': texts?.negotiation || 'Negotiation',
      'won': texts?.won || 'Won',
      'lost': texts?.lost || 'Lost'
    };

    return stageMap[stage.toLowerCase()] || stage;
  };

  // Transform data dengan translasi yang selalu update
  const data = rawData.map(r => ({
    name: r.deal_stage,
    nameTranslated: translateDealStage(r.deal_stage),
    value: r.count
  }));

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          dark
            ? 'bg-slate-800 border-slate-600 text-white'
            : 'bg-white border-gray-200 text-slate-900'
        }`}>
          <p className="font-semibold">{item.nameTranslated}</p>
          <p className="text-sm">
            {texts?.count || 'Count'}: <span
              className="font-bold"
              style={{ color: item.fill }}
            >
              {item.value}
            </span> {texts?.deals || 'Deals'}
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
        {payload.map((entry, index) => {
          const item = data[index];
          return (
            <li key={`legend-${index}`} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className={dark ? 'text-slate-300' : 'text-slate-700'}>
                {item?.nameTranslated || entry.value}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  // Loading state
  if (rawData.length === 0) {
    return (
      <div className={`p-4 rounded-xl shadow ${dark ? "bg-slate-800" : "bg-white"}`}>
        <h3 className={`font-semibold mb-3 ${dark ? "text-white" : "text-slate-800"}`}>
          {texts?.dealsByStage || 'Deals by Stage'}
        </h3>
        <div className="flex items-center justify-center h-[250px]">
          <p className={dark ? 'text-slate-400' : 'text-slate-600'}>
            {language === 'id' ? 'Memuat...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl shadow ${dark ? "bg-slate-800" : "bg-white"}`}>
      <h3 className={`font-semibold mb-3 ${dark ? "text-white" : "text-slate-800"}`}>
        {texts?.dealsByStage || 'Deals by Stage'}
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="nameTranslated"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ nameTranslated, percent }) =>
              `${nameTranslated} ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((entry, i) => (
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