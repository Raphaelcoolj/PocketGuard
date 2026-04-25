import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Category } from "@/lib/models/Category";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_CATEGORIES = [
  { name: "Salary", icon: "💼", color: "#22c55e", type: "income" },
  { name: "Freelance", icon: "💻", color: "#10b981", type: "income" },
  { name: "Investments", icon: "📈", color: "#06b6d4", type: "income" },
  { name: "Housing", icon: "🏠", color: "#6366f1", type: "expense" },
  { name: "Food & Dining", icon: "🍔", color: "#f59e0b", type: "expense" },
  { name: "Transport", icon: "🚗", color: "#3b82f6", type: "expense" },
  { name: "Healthcare", icon: "🏥", color: "#ef4444", type: "expense" },
  { name: "Entertainment", icon: "🎬", color: "#8b5cf6", type: "expense" },
  { name: "Shopping", icon: "🛍️", color: "#ec4899", type: "expense" },
  { name: "Utilities", icon: "⚡", color: "#f97316", type: "expense" },
];

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currency } = await req.json();

    await connectDB();

    await User.findByIdAndUpdate(session.user.id, {
      currency: currency || "USD",
      onboardingComplete: true,
    });

    const existing = await Category.findOne({ userId: session.user.id });
    if (!existing) {
      await Category.insertMany(
        DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: session.user.id }))
      );
    }

    return NextResponse.json({ message: "Onboarding complete" });
  } catch (err) {
    console.error("Onboard error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}