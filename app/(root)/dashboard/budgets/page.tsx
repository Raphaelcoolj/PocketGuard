"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { useCurrency } from "@/components/providers/CurrencyProvider";

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

interface Budget {
  _id: string;
  amount: number;
  spent: number;
  month: number;
  year: number;
  categoryId: {
    _id: string;
    name: string;
    icon: string;
    color: string;
  };
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Form state
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchBudgets() {
    setLoading(true);
    const [budgetRes, catRes] = await Promise.all([
      fetch(`/api/budgets?month=${month}&year=${year}`),
      fetch("/api/categories"),
    ]);
    const budgetData = await budgetRes.json();
    const catData = await catRes.json();
    setBudgets(budgetData || []);
    setCategories(catData.filter((c: Category) => c.type === "expense") || []);
    setLoading(false);
  }

  useEffect(() => { fetchBudgets(); }, [month, year]);

  async function handleAdd() {
    if (!categoryId || !amount) return;
    setSubmitting(true);

    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId,
        amount: parseFloat(amount),
        month,
        year,
      }),
    });

    if (res.ok) {
      setShowModal(false);
      setCategoryId("");
      setAmount("");
      fetchBudgets();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    setBudgets((prev) => prev.filter((b) => b._id !== id));
  }

  const { fmt } = useCurrency();

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  // Categories that don't have a budget yet this month
  const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId._id));
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c._id));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Set spending limits per category
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
          <button
            onClick={() => setShowModal(true)}
            disabled={availableCategories.length === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            <Plus size={16} />
            Add Budget
          </button>
        </div>
      </div>

      {/* Overall Summary */}
      {budgets.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">Overall Budget</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fmt(totalSpent)} of {fmt(totalBudgeted)} spent
              </p>
            </div>
            <span
              className={`text-sm font-bold ${
                overallPct >= 100
                  ? "text-red-500"
                  : overallPct >= 80
                  ? "text-yellow-500"
                  : "text-green-500"
              }`}
            >
              {Math.round(overallPct)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                overallPct >= 100
                  ? "bg-red-500"
                  : overallPct >= 80
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(overallPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No budgets for this period</p>
          <p className="text-sm mt-1">Add a budget to start tracking your spending limits</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            const remaining = budget.amount - budget.spent;
            const isOver = pct >= 100;
            const isWarning = pct >= 80 && pct < 100;

            return (
              <div
                key={budget._id}
                className="bg-card border border-border rounded-xl p-5 space-y-4"
              >
                {/* Category header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-base"
                      style={{ backgroundColor: budget.categoryId.color + "20" }}
                    >
                      {budget.categoryId.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{budget.categoryId.name}</p>
                      <p className="text-xs text-muted-foreground">{MONTHS[month - 1]}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(budget._id)}
                    className="text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">
                      {fmt(budget.spent)} spent
                    </span>
                    <span className="font-medium">{fmt(budget.amount)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver
                          ? "bg-red-500"
                          : isWarning
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: !isOver && !isWarning
                          ? budget.categoryId.color
                          : undefined,
                      }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  {isOver ? (
                    <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
                      <AlertCircle size={12} />
                      Over by {fmt(Math.abs(remaining))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {fmt(remaining)} remaining
                    </p>
                  )}
                  <span
                    className={`text-xs font-bold ${
                      isOver
                        ? "text-red-500"
                        : isWarning
                        ? "text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {Math.round(pct)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-5">Add Budget</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a category</option>
                  {availableCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Budget Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting || !categoryId || !amount}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                {submitting ? "Saving..." : "Add Budget"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}