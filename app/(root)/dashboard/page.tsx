"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

interface Summary {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyNet: number;
  totalBalance: number;
  recentTransactions: any[];
  spendingByCategory: { name: string; icon: string; color: string; total: number }[];
  dailyChart: { date: string; income: number; expense: number }[];
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
  setLoading(true);
  fetch(`/api/summary?month=${month}&year=${year}`)
    .then((r) => r.json())
    .then((data) => {
      if (data.error) {
        console.error("Summary API error:", data.error);
        setLoading(false);
        return;
      }
      setSummary(data);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Fetch error:", err);
      setLoading(false);
    });
}, [month, year]);

  const { fmt } = useCurrency();

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const statCards = [
    {
      label: "Total Balance",
      value: fmt(summary.totalBalance),
      icon: Wallet,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      sub: "All time",
    },
    {
      label: "Income",
      value: fmt(summary.monthlyIncome),
      icon: ArrowUpCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
      sub: MONTHS[month - 1],
    },
    {
      label: "Expenses",
      value: fmt(summary.monthlyExpenses),
      icon: ArrowDownCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      sub: MONTHS[month - 1],
    },
    {
      label: "Net",
      value: fmt(summary.monthlyNet),
      icon: summary.monthlyNet >= 0 ? TrendingUp : TrendingDown,
      color: summary.monthlyNet >= 0 ? "text-green-500" : "text-red-500",
      bg: summary.monthlyNet >= 0 ? "bg-green-500/10" : "bg-red-500/10",
      sub: MONTHS[month - 1],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Your financial summary
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
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
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon size={16} className={color} />
              </div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Income vs Expenses</h2>
          {summary.dailyChart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={summary.dailyChart}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} />
                <Tooltip
                  formatter={(value: number) => fmt(value)}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#incomeGrad)" name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Top Spending</h2>
          {summary.spendingByCategory.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No expenses this period
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={summary.spendingByCategory}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    strokeWidth={0}
                  >
                    {summary.spendingByCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => fmt(value)}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {summary.spendingByCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.icon} {cat.name}</span>
                    </div>
                    <span className="font-medium">{fmt(cat.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Recent Transactions</h2>
        </div>
        {summary.recentTransactions.length === 0 ? (
          <div className="px-5 py-10 text-center text-muted-foreground text-sm">
            No transactions this period
          </div>
        ) : (
          summary.recentTransactions.map((tx, i) => (
            <div
              key={tx._id}
              className={`flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition ${
                i !== 0 ? "border-t border-border" : ""
              }`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: (tx.categoryId?.color || "#6366f1") + "20" }}
              >
                {tx.categoryId?.icon || (tx.type === "income" ? "💰" : "💸")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {tx.description || tx.categoryId?.name || "Uncategorized"}
                </p>
                <p className="text-xs text-muted-foreground">{fmtDate(tx.date)}</p>
              </div>
              <span className={`text-sm font-semibold ${tx.type === "income" ? "text-green-500" : "text-red-500"}`}>
                {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}