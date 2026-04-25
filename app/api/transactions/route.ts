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
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");

    const query: any = { userId: session.user.id };
    if (type) query.type = type;
    if (categoryId) query.categoryId = categoryId;

    await connectDB();

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("categoryId", "name icon color")
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    return NextResponse.json({ transactions, total, page, limit });
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount, type, categoryId, description, date } = await req.json();

    if (!amount || !type)
      return NextResponse.json({ error: "Amount and type are required" }, { status: 400 });

    await connectDB();

    const transaction = await Transaction.create({
      userId: session.user.id,
      amount: Math.abs(amount),
      type,
      categoryId: categoryId || null,
      description: description || "",
      date: date ? new Date(date) : new Date(),
      source: "manual",
    });

    const populated = await transaction.populate("categoryId", "name icon color");
    return NextResponse.json(populated, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}