import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { Category } from "@/lib/models/Category"; // 👈 add this
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    await connectDB();

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const transactions = await Transaction.find({
      userId: session.user.id,
      date: { $gte: start, $lte: end },
    })
      .populate("categoryId", "name icon color")
      .lean();

    // Monthly income vs expenses for the whole year
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i).toLocaleDateString("en-US", { month: "short" }),
      income: 0,
      expense: 0,
    }));

    transactions.forEach((t) => {
      const m = new Date(t.date).getMonth();
      monthlyData[m][t.type === "income" ? "income" : "expense"] += t.amount;
    });

    // Spending by category (full year)
    const categoryMap: Record<string, {
      name: string; icon: string; color: string; total: number; count: number;
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
            count: 0,
          };
        }
        categoryMap[cat._id].total += t.amount;
        categoryMap[cat._id].count += 1;
      });

    const spendingByCategory = Object.values(categoryMap)
      .sort((a, b) => b.total - a.total);

    const totalExpenses = spendingByCategory.reduce((s, c) => s + c.total, 0);
    const spendingWithPct = spendingByCategory.map((c) => ({
      ...c,
      pct: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0,
    }));

    // Monthly net savings
    const savingsData = monthlyData.map((m) => ({
      month: m.month,
      savings: m.income - m.expense,
    }));

    // Biggest expenses (top 5 single transactions)
    const biggestExpenses = transactions
      .filter((t) => t.type === "expense")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((t) => ({
        _id: t._id,
        amount: t.amount,
        description: t.description,
        date: t.date,
        category: t.categoryId,
      }));

    // Income sources
    const incomeMap: Record<string, {
      name: string; icon: string; color: string; total: number;
    }> = {};

    transactions
      .filter((t) => t.type === "income" && t.categoryId)
      .forEach((t) => {
        const cat = t.categoryId as any;
        if (!incomeMap[cat._id]) {
          incomeMap[cat._id] = {
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            total: 0,
          };
        }
        incomeMap[cat._id].total += t.amount;
      });

    const incomeSources = Object.values(incomeMap).sort((a, b) => b.total - a.total);

    // Stats
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);

    const avgMonthlyExpense =
      monthlyData.filter((m) => m.expense > 0).reduce((s, m) => s + m.expense, 0) /
      (monthlyData.filter((m) => m.expense > 0).length || 1);

    const avgMonthlyIncome =
      monthlyData.filter((m) => m.income > 0).reduce((s, m) => s + m.income, 0) /
      (monthlyData.filter((m) => m.income > 0).length || 1);

    return NextResponse.json({
      monthlyData,
      savingsData,
      spendingByCategory: spendingWithPct,
      incomeSources,
      biggestExpenses,
      stats: {
        totalIncome,
        totalExpenses,
        netSavings: totalIncome - totalExpenses,
        avgMonthlyExpense,
        avgMonthlyIncome,
        totalTransactions: transactions.length,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}