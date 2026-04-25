import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Budget } from "@/lib/models/Budget";
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
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    await connectDB();

    const budgets = await Budget.find({
      userId: session.user.id,
      month,
      year,
    }).populate("categoryId", "name icon color").lean();

    // Get actual spending per category for this month
    const transactions = await Transaction.find({
      userId: session.user.id,
      type: "expense",
      date: { $gte: start, $lte: end },
    }).lean();

    const spentMap: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.categoryId) {
        const key = t.categoryId.toString();
        spentMap[key] = (spentMap[key] || 0) + t.amount;
      }
    });

    const budgetsWithSpent = budgets.map((b) => ({
      ...b,
      spent: spentMap[b.categoryId._id.toString()] || 0,
    }));

    return NextResponse.json(budgetsWithSpent);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { categoryId, amount, month, year } = await req.json();

    if (!categoryId || !amount || !month || !year)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });

    await connectDB();

    // Upsert — one budget per category per month
    const budget = await Budget.findOneAndUpdate(
      { userId: session.user.id, categoryId, month, year },
      { amount },
      { upsert: true, new: true }
    ).populate("categoryId", "name icon color");

    return NextResponse.json(budget, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}