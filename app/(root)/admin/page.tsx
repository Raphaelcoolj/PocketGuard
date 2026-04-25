"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import {
  Users, ArrowLeftRight, TrendingUp,
  Activity, DollarSign, UserCheck,
} from "lucide-react";

interface AdminData {
  stats: {
    totalUsers: number;
    newUsersThisMonth: number;
    activeUsersLast30: number;
    totalTransactions: number;
    transactionsThisMonth: number;
    onboardingRate: number;
    totalVolume: number;
  };
  userGrowth: { date: string; users: number }[];
  txGrowth: { date: string; transactions: number }[];
  monthlySignups: { month: string; users: number }[];
  recentUsers: any[];
  recentTransactions: any[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
};

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, userGrowth, txGrowth, monthlySignups, recentUsers, recentTransactions } = data;

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      sub: `+${stats.newUsersThisMonth} this month`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Users (30d)",
      value: stats.activeUsersLast30.toLocaleString(),
      sub: `${stats.totalUsers > 0 ? Math.round((stats.activeUsersLast30 / stats.totalUsers) * 100) : 0}% of total`,
      icon: Activity,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Total Transactions",
      value: stats.totalTransactions.toLocaleString(),
      sub: `+${stats.transactionsThisMonth} this month`,
      icon: ArrowLeftRight,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Total Volume",
      value: fmt(stats.totalVolume),
      sub: "All time processed",
      icon: DollarSign,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Onboarding Rate",
      value: `${stats.onboardingRate}%`,
      sub: "Users completed setup",
      icon: UserCheck,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
    {
      label: "Avg Tx / User",
      value: stats.totalUsers > 0
        ? (stats.totalTransactions / stats.totalUsers).toFixed(1)
        : "0",
      sub: "Transactions per user",
      icon: TrendingUp,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Platform overview and activity
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Signups */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Monthly Signups ({new Date().getFullYear()})</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlySignups}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="users" name="New Users" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Last 7 Days */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">New Users — Last 7 Days</h2>
          {userGrowth.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              No new users in the last 7 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="users"
                  name="New Users"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#userGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-4">Transaction Activity — Last 7 Days</h2>
        {txGrowth.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            No transactions in the last 7 days
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={txGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="transactions"
                name="Transactions"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: "#22c55e", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Users */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Users</h2>
            <span className="text-xs text-muted-foreground">{stats.totalUsers} total</span>
          </div>
          {recentUsers.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">No users yet</div>
          ) : (
            recentUsers.map((user, i) => (
              <div
                key={user._id}
                className={`flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition ${
                  i !== 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name || "No name"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.onboardingComplete
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {user.onboardingComplete ? "Active" : "Pending"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {fmtDate(user.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Transactions</h2>
            <span className="text-xs text-muted-foreground">{stats.totalTransactions} total</span>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">No transactions yet</div>
          ) : (
            recentTransactions.map((tx, i) => (
              <div
                key={tx._id}
                className={`flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition ${
                  i !== 0 ? "border-t border-border" : ""
                }`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  tx.type === "income" ? "bg-green-500" : "bg-red-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {tx.description || "No description"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {tx.userId?.name || tx.userId?.email || "Unknown user"}
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className={`text-sm font-semibold ${
                    tx.type === "income" ? "text-green-500" : "text-red-500"
                  }`}>
                    {tx.type === "income" ? "+" : "-"}
                    {fmt(tx.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {fmtDate(tx.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}