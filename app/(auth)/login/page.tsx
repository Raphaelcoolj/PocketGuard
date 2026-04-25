"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Separate the form logic into a sub-component to allow Suspense to work
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
    } else if (res?.ok) {
      router.push("/dashboard");
    }
  }

  return (
    <div className="w-full max-w-md bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-8">
      <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Sign in to your PocketGuard account
      </p>

      {registered && (
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 text-sm px-3 py-2 rounded-lg mb-4">
          Account created! Please sign in.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-center text-muted-foreground mt-6">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="text-foreground font-medium hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

// Main Page component
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Wrapping the form in Suspense fixes the build error */}
      <Suspense fallback={
        <div className="w-full max-w-md p-8 text-center text-muted-foreground">
          Loading login form...
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
