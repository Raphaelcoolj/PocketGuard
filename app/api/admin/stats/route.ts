import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Transaction } from "@/lib/models/Transaction";
import { Category } from "@/lib/models/Category"; // 👈 add this
import { Budget } from "@/lib/models/Budget";     // 👈 add this
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisMonth,
      activeUsersLast30,
      totalTransactions,
      transactionsThisMonth,
      allUsers,
      recentTransactions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ updatedAt: { $gte: last30 } }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.find().sort({ createdAt: -1 }).limit(8).select("-password").lean(),
      Transaction.find().sort({ createdAt: -1 }).limit(5)
        .populate("userId", "name email")
        .lean(),
    ]);

    // Users registered per day last 7 days
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Transactions per day last 7 days
    const txGrowth = await Transaction.aggregate([
      { $match: { createdAt: { $gte: last7 } } },
      {
        $group: {
          _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Users registered per month this year
    const monthlySignups = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lte: new Date(now.getFullYear(), 11, 31),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlySignupsFormatted = MONTHS.map((m, i) => ({
      month: m,
      users: monthlySignups.find((s) => s._id === i + 1)?.count || 0,
    }));

    // Onboarding completion rate
    const completedOnboarding = await User.countDocuments({ onboardingComplete: true });

    // Transaction volume (total $ processed) - converted to USD
    const volumeResult = await Transaction.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true }
      },
      {
        $addFields: {
          rate: {
            $switch: {
              branches: [
                { case: { $eq: ["$user.currency", "USD"] }, then: 1 },
                { case: { $eq: ["$user.currency", "EUR"] }, then: 1.08 },
                { case: { $eq: ["$user.currency", "GBP"] }, then: 1.25 },
                { case: { $eq: ["$user.currency", "NGN"] }, then: 0.0007 },
                { case: { $eq: ["$user.currency", "GHS"] }, then: 0.076 },
                { case: { $eq: ["$user.currency", "KES"] }, then: 0.0076 },
                { case: { $eq: ["$user.currency", "ZAR"] }, then: 0.053 },
                { case: { $eq: ["$user.currency", "CAD"] }, then: 0.73 },
                { case: { $eq: ["$user.currency", "AUD"] }, then: 0.65 },
                { case: { $eq: ["$user.currency", "INR"] }, then: 0.012 },
              ],
              default: 1
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$amount", "$rate"] } }
        }
      }
    ]);
    const totalVolume = volumeResult[0]?.total || 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        newUsersThisMonth,
        activeUsersLast30,
        totalTransactions,
        transactionsThisMonth,
        onboardingRate: totalUsers > 0
          ? Math.round((completedOnboarding / totalUsers) * 100)
          : 0,
        totalVolume,
      },
      userGrowth: userGrowth.map((d) => ({ date: d._id, users: d.count })),
      txGrowth: txGrowth.map((d) => ({ date: d._id, transactions: d.count })),
      monthlySignups: monthlySignupsFormatted,
      recentUsers: allUsers,
      recentTransactions,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}