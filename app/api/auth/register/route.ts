import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ message: "register route is working" });
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing)
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });

    return NextResponse.json({ message: "Account created" }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}