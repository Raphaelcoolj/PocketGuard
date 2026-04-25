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
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = allTime
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = allTime
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryMap: Record<string, {
      name: string; icon: string; color: string; total: number;
    }> = {};

    transactions
      .filter((t) => t.type === "expense" && t.categoryId)
      .forEach((t) => {
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

    const dailyMap: Record<string, { income: number; expense: number }> = {};
    transactions.forEach((t) => {
      const day = new Date(t.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!dailyMap[day]) dailyMap[day] = { income: 0, expense: 0 };
      dailyMap[day][t.type] += t.amount;
    });

    const dailyChart = Object.entries(dailyMap)
      .map(([date, values]) => ({ date, ...values }))
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