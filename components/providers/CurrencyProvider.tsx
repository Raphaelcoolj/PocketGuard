"use client";

import { createContext, useContext } from "react";
import { useSession } from "next-auth/react";

interface CurrencyContextValue {
  currency: string;
  fmt: (n: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  fmt: (n) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n),
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  // Falls back to USD if the session hasn't hydrated yet
  const currency = session?.user?.currency || "USD";

  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(n);
    } catch {
      // Fallback if the currency code is somehow invalid
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(n);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, fmt }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
