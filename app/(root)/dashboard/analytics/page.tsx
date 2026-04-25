"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useCurrency } from "@/components/providers/CurrencyProvider";

// ... (Interfaces and TOOLTIP_STYLE remain the same)

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const { fmt } = useCurrency();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?year=${year}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [year, fmt]); // Added fmt to dependencies as good practice

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Helper to safely format chart values
  const chartFmt = (v: any) => fmt(Number(v) || 0);

  if (loading) { /* ... loading skeleton ... */ }
  if (!data) return null;

  const { monthlyData, savingsData, spendingByCategory, incomeSources, biggestExpenses, stats } = data;

  return (
    <div className="p-6 space-y-6">
      {/* ... Header and Stat Cards ... */}

      {/* Income vs Expenses Bar Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Monthly Income vs Expenses</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} barGap={4}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={chartFmt} />
            {/* FIX: Use chartFmt or an inline check */}
            <Tooltip formatter={(v: any) => chartFmt(v)} contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Savings Trend */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Monthly Savings Trend</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={savingsData}>
            {/* ... AreaChart Defs ... */}
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={chartFmt} />
            {/* FIX: Tooltip formatter updated */}
            <Tooltip formatter={(v: any) => chartFmt(v)} contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="savings" name="Savings" stroke="#6366f1" strokeWidth={2} fill="url(#savingsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Spending Breakdown & Income Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Spending Breakdown</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={spendingByCategory} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={0}>
                {spendingByCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              {/* FIX: Tooltip formatter updated */}
              <Tooltip formatter={(v: any) => chartFmt(v)} contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          {/* ... category list ... */}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Income Sources</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={incomeSources} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={0}>
                {incomeSources.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              {/* FIX: Tooltip formatter updated */}
              <Tooltip formatter={(v: any) => chartFmt(v)} contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          {/* ... income source list ... */}
        </div>
      </div>

      {/* ... Biggest Expenses table ... */}
    </div>
  );
}
