"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useCurrency } from "@/components/providers/CurrencyProvider";

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  date: string;
  categoryId?: {
    _id: string;
    name: string;
    icon: string;
    color: string;
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  async function fetchAll() {
    setLoading(true);
    const [txRes, catRes] = await Promise.all([
      fetch("/api/transactions"),
      fetch("/api/categories"),
    ]);
    const txData = await txRes.json();
    const catData = await catRes.json();
    setTransactions(txData.transactions || []);
    setCategories(catData || []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleAdd() {
    if (!amount) return;
    setSubmitting(true);

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(amount), type, categoryId, description, date }),
    });

    if (res.ok) {
      setShowModal(false);
      setAmount("");
      setDescription("");
      setCategoryId("");
      setType("expense");
      setDate(new Date().toISOString().split("T")[0]);
      fetchAll();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setTransactions((prev) => prev.filter((t) => t._id !== id));
  }

  const filteredCategories = categories.filter((c) => c.type === type);

  const { fmt: formatCurrency } = useCurrency();

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-15 sm:mt-0 md:mt-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-2 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No transactions yet</p>
          <p className="text-sm mt-1">Add your first transaction to get started</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {transactions.map((tx, i) => (
            <div
              key={tx._id}
              className={`flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition ${
                i !== 0 ? "border-t border-border" : ""
              }`}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: tx.categoryId?.color + "20" }}
              >
                {tx.categoryId?.icon || (tx.type === "income" ? "💰" : "💸")}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {tx.description || tx.categoryId?.name || "Uncategorized"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tx.categoryId?.name && tx.description
                    ? `${tx.categoryId.name} · `
                    : ""}
                  {formatDate(tx.date)}
                </p>
              </div>

              {/* Amount */}
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-sm font-semibold ${
                    tx.type === "income" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
                <button
                  onClick={() => handleDelete(tx._id)}
                  className="text-muted-foreground hover:text-destructive transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-5">Add Transaction</h2>

            <div className="space-y-4">
              {/* Type toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => { setType("expense"); setCategoryId(""); }}
                  className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition ${
                    type === "expense"
                      ? "bg-red-500 text-white"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <ArrowDownCircle size={15} /> Expense
                </button>
                <button
                  onClick={() => { setType("income"); setCategoryId(""); }}
                  className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition ${
                    type === "income"
                      ? "bg-green-500 text-white"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <ArrowUpCircle size={15} /> Income
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
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

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a category</option>
                  {filteredCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Optional note"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                disabled={submitting || !amount}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                {submitting ? "Saving..." : "Add Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}