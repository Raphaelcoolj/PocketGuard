"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useCurrency } from "@/components/providers/CurrencyProvider";

interface AnalyticsData {
  monthlyData: { month: string; income: number; expense: number }[];
  savingsData: { month: string; savings: number }[];
  spendingByCategory: { name: string; icon: string; color: string; total: number; pct: number }[];
  incomeSources: { name: string; icon: string; color: string; total: number }[];
  biggestExpenses: { _id: string; amount: number; description: string; date: string; category: any }[];
  stats: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    avgMonthlyExpense: number;
    avgMonthlyIncome: number;
    totalTransactions: number;
  };
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?year=${year}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [year]);

  const { fmt } = useCurrency();

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-muted rounded w-40 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { monthlyData, savingsData, spendingByCategory, incomeSources, biggestExpenses, stats } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Your financial insights for {year}
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="px-3 py-1.5 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {[2023, 2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Total Income", value: fmt(stats.totalIncome), color: "text-green-500" },
          { label: "Total Expenses", value: fmt(stats.totalExpenses), color: "text-red-500" },
          { label: "Net Savings", value: fmt(stats.netSavings), color: stats.netSavings >= 0 ? "text-green-500" : "text-red-500" },
          { label: "Avg Monthly Income", value: fmt(stats.avgMonthlyIncome), color: "text-blue-500" },
          { label: "Avg Monthly Spend", value: fmt(stats.avgMonthlyExpense), color: "text-orange-500" },
          { label: "Total Transactions", value: stats.totalTransactions.toString(), color: "text-purple-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Income vs Expenses Bar Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Monthly Income vs Expenses</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} barGap={4}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} />
            <Tooltip formatter={(v: number) => fmt(v)} contentStyle={TOOLTIP_STYLE} />
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
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} />
            <Tooltip
              formatter={(v: number) => fmt(v)}
              contentStyle={TOOLTIP_STYLE}
            />
            <Area
              type="monotone"
              dataKey="savings"
              name="Savings"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#savingsGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Spending by Category + Income Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spending Breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Spending Breakdown</h2>
          {spendingByCategory.length === 0 ? (
            <p className="text-muted-foreground text-sm">No expense data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    strokeWidth={0}
                  >
                    {spendingByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {spendingByCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs flex-1 truncate">{cat.icon} {cat.name}</span>
                    <span className="text-xs text-muted-foreground">{cat.pct}%</span>
                    <span className="text-xs font-medium">{fmt(cat.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Income Sources */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Income Sources</h2>
          {incomeSources.length === 0 ? (
            <p className="text-muted-foreground text-sm">No income data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={incomeSources}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    strokeWidth={0}
                  >
                    {incomeSources.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {incomeSources.map((src) => (
                  <div key={src.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: src.color }} />
                    <span className="text-xs flex-1 truncate">{src.icon} {src.name}</span>
                    <span className="text-xs font-medium">{fmt(src.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Biggest Expenses */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Biggest Expenses</h2>
        </div>
        {biggestExpenses.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground text-sm">
            No expense data for {year}
          </div>
        ) : (
          biggestExpenses.map((tx, i) => (
            <div
              key={tx._id.toString()}
              className={`flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition ${
                i !== 0 ? "border-t border-border" : ""
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: (tx.category?.color || "#ef4444") + "20" }}
              >
                {tx.category?.icon || "💸"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {tx.description || tx.category?.name || "Uncategorized"}
                </p>
                <p className="text-xs text-muted-foreground">{fmtDate(tx.date)}</p>
              </div>
              <span className="text-sm font-semibold text-red-500">
                -{fmt(tx.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}