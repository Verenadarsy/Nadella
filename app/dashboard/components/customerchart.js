"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";

export default function CustomerChart({ dark }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/dashboard/chart/customer")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div className={`p-4 rounded-xl shadow ${dark ? "bg-slate-800" : "bg-white"}`}>
      <h3 className={`font-semibold mb-3 ${dark ? "text-white" : "text-slate-800"}`}>
        Customer Growth per Month
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
