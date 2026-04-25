import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const categories = await Category.find({ userId: session.user.id }).lean();
    return NextResponse.json(categories);
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, icon, color, type } = await req.json();
    if (!name || !type)
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });

    await connectDB();
    const category = await Category.create({
      userId: session.user.id,
      name,
      icon: icon || "📦",
      color: color || "#6366f1",
      type,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}