"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense";
}

const ICONS = ["💼","💻","📈","🏠","🍔","🚗","🏥","🎬","🛍️","⚡","✈️","🎓","💊","🐾","🏋️","🎮","📱","🍕","☕","🎁","💇","🏦","📚","🌿","🎵"];

const COLORS = [
  "#22c55e","#10b981","#06b6d4","#3b82f6","#6366f1",
  "#8b5cf6","#ec4899","#ef4444","#f97316","#f59e0b",
  "#84cc16","#14b8a6","#0ea5e9","#a855f7","#d946ef",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"expense" | "income">("expense");

  // Form state
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("#6366f1");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [submitting, setSubmitting] = useState(false);

  async function fetchCategories() {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  async function handleAdd() {
    if (!name) return;
    setSubmitting(true);

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, icon, color, type }),
    });

    if (res.ok) {
      setShowModal(false);
      setName("");
      setIcon("📦");
      setColor("#6366f1");
      fetchCategories();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c._id !== id));
  }

  const filtered = categories.filter((c) => c.type === tab);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className=" mt-15 sm:mt-0 md:mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your income and expense categories
          </p>
        </div>
        <button
          onClick={() => { setType(tab); setShowModal(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition capitalize ${
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Category Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No {tab} categories yet</p>
          <p className="text-sm mt-1">Add one to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((cat) => (
            <div
              key={cat._id}
              className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 group"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: cat.color + "20" }}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cat.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <p className="text-xs text-muted-foreground">{cat.color}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(cat._id)}
                className="text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-5">New Category</h2>

            <div className="space-y-5">
              {/* Type toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 text-sm font-medium capitalize transition ${
                      type === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Groceries"
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="block text-sm font-medium mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((i) => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition ${
                        icon === i
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-7 h-7 rounded-full transition ring-offset-2 ring-offset-background"
                      style={{
                        backgroundColor: c,
                        boxShadow: color === c ? `0 0 0 2px var(--background), 0 0 0 4px ${c}` : "none",
                      }}
                    />
                  ))}
                </div>

                {/* Preview */}
                <div className="flex items-center gap-2 mt-3 p-3 bg-muted rounded-lg">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                    style={{ backgroundColor: color + "30" }}
                  >
                    {icon}
                  </div>
                  <span className="text-sm font-medium">{name || "Preview"}</span>
                </div>
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
                disabled={submitting || !name}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                {submitting ? "Saving..." : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}