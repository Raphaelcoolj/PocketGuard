"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
  { code: "GHS", symbol: "₵", label: "Ghanaian Cedi" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    setLoading(true);

    const res = await fetch("/api/user/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency }),
    });

    if (!res.ok) {
      console.error("Onboarding failed:", await res.text());
      setLoading(false);
      return;
    }

    // Force a full page reload so the session token gets refreshed
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-lg bg-card text-card-foreground border border-border rounded-2xl p-8 shadow-sm">
        <div className="mb-8">
          <span className="text-3xl">👋</span>
          <h1 className="text-2xl font-bold mt-2">Welcome! Let's get you set up</h1>
          <p className="text-muted-foreground text-sm mt-1">
            This takes less than a minute. We'll create your default categories automatically.
          </p>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium mb-3">
            What currency do you use?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                  currency === c.code
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <span className="font-mono font-bold">{c.symbol}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-muted rounded-xl p-4 mb-8">
          <p className="text-sm font-medium mb-2">✅ We'll also create these categories for you:</p>
          <div className="flex flex-wrap gap-2">
            {["💼 Salary", "🏠 Housing", "🍔 Food", "🚗 Transport", "🎬 Entertainment", "🛍️ Shopping", "⚡ Utilities", "+ more"].map((cat) => (
              <span key={cat} className="text-xs bg-background border border-border px-2 py-1 rounded-full">
                {cat}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={handleFinish}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? "Setting up your account..." : "Go to Dashboard →"}
        </button>
      </div>
    </div>
  );
}