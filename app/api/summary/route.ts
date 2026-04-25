import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { Category } from "@/lib/models/Category";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    await connectDB();

    // Force model registration
    void Category;

    const [transactions, allTime] = await Promise.all([
      Transaction.find({
        userId: session.user.id,
        date: { $gte: start, $lte: end },
      })
        .populate("categoryId", "name icon color")
        .sort({ date: -1 })
        .lean(),
      Transaction.find({ userId: session.user.id }).lean(),
    ]);

    const monthlyIncome = transactions
      .filter((t: any) => t.type === "income")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter((t: any) => t.type === "expense")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const totalIncome = allTime
      .filter((t: any) => t.type === "income")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const totalExpenses = allTime
      .filter((t: any) => t.type === "expense")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const categoryMap: Record<string, {
      name: string; icon: string; color: string; total: number;
    }> = {};

    transactions
      .filter((t: any) => t.type === "expense" && t.categoryId)
      .forEach((t: any) => {
        const cat = t.categoryId as any;
        if (!categoryMap[cat._id]) {
          categoryMap[cat._id] = {
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            total: 0,
          };
        }
        categoryMap[cat._id].total += t.amount;
      });

    const spendingByCategory = Object.values(categoryMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // FIXED: Typed the dailyMap keys strictly
    const dailyMap: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach((t: any) => {
      const day = new Date(t.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      
      if (!dailyMap[day]) dailyMap[day] = { income: 0, expense: 0 };
      
      // FIX: Explicitly cast t.type to the allowed keys to satisfy TypeScript
      if (t.type === "income" || t.type === "expense") {
        dailyMap[day][t.type as "income" | "expense"] += t.amount;
      }
    });

    const dailyChart = Object.entries(dailyMap)
      .map(([date, values]) => ({ date, ...values }))
      // Sort by date to ensure the chart flows left-to-right
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    return NextResponse.json({
      monthlyIncome,
      monthlyExpenses,
      monthlyNet: monthlyIncome - monthlyExpenses,
      totalBalance: totalIncome - totalExpenses,
      recentTransactions: transactions.slice(0, 5),
      spendingByCategory,
      dailyChart,
    });
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
