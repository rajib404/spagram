import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const now = new Date();

    // Get monthly revenue for the last 12 months
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [revenue, feeIncome, count] = await Promise.all([
        db.booking.aggregate({
          _sum: { totalPrice: true },
          where: {
            status: { in: ["ACCEPTED", "COMPLETED"] },
            createdAt: { gte: start, lt: end },
          },
        }),
        db.booking.aggregate({
          _sum: { bookingFee: true },
          where: {
            status: { in: ["ACCEPTED", "COMPLETED"] },
            createdAt: { gte: start, lt: end },
          },
        }),
        db.booking.count({
          where: {
            createdAt: { gte: start, lt: end },
          },
        }),
      ]);

      monthlyData.push({
        month: start.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: parseFloat(revenue._sum.totalPrice?.toString() ?? "0"),
        feeIncome: parseFloat(feeIncome._sum.bookingFee?.toString() ?? "0"),
        bookings: count,
      });
    }

    // Status breakdown
    const statusCounts = await db.booking.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const statusBreakdown: Record<string, number> = {};
    for (const s of statusCounts) {
      statusBreakdown[s.status] = s._count._all;
    }

    // Top therapists by revenue
    const topTherapists = await db.booking.groupBy({
      by: ["therapistProfileId"],
      _sum: { totalPrice: true },
      _count: { _all: true },
      where: { status: { in: ["ACCEPTED", "COMPLETED"] } },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 5,
    });

    const therapistProfiles = await db.therapistProfile.findMany({
      where: { id: { in: topTherapists.map((t) => t.therapistProfileId) } },
      select: { id: true, displayName: true },
    });

    const profileMap = new Map(therapistProfiles.map((p) => [p.id, p.displayName]));

    return NextResponse.json({
      monthlyData,
      statusBreakdown,
      topTherapists: topTherapists.map((t) => ({
        therapistName: profileMap.get(t.therapistProfileId) ?? "Unknown",
        revenue: parseFloat(t._sum.totalPrice?.toString() ?? "0"),
        bookings: t._count._all,
      })),
    });
  } catch (error) {
    logger.error("Error fetching admin revenue:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to fetch revenue data" }, { status: 500 });
  }
}
