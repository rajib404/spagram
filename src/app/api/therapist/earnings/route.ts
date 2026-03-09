import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

function calcRevenue(sum: { totalPrice: unknown; bookingFee: unknown }) {
  const total = Number(sum.totalPrice ?? 0);
  const fee = Number(sum.bookingFee ?? 0);
  return (total - fee).toFixed(2);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileId = session.user.therapistProfileId;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const [totalResult, monthlyResult, pendingResult, recentBookings] =
      await Promise.all([
        // Total earnings (all time) — completed bookings
        db.booking.aggregate({
          where: {
            therapistProfileId: profileId,
            status: "COMPLETED",
          },
          _sum: { totalPrice: true, bookingFee: true },
        }),

        // Monthly earnings — completed bookings this month
        db.booking.aggregate({
          where: {
            therapistProfileId: profileId,
            status: "COMPLETED",
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { totalPrice: true, bookingFee: true },
        }),

        // Pending payouts — accepted but not yet completed
        db.booking.aggregate({
          where: {
            therapistProfileId: profileId,
            status: "ACCEPTED",
          },
          _sum: { totalPrice: true, bookingFee: true },
        }),

        // Recent transactions (last 10 completed/accepted bookings)
        db.booking.findMany({
          where: {
            therapistProfileId: profileId,
            status: { in: ["ACCEPTED", "COMPLETED"] },
          },
          include: {
            client: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { date: "desc" },
          take: 10,
        }),
      ]);

    return NextResponse.json({
      totalEarnings: calcRevenue(totalResult._sum),
      monthlyEarnings: calcRevenue(monthlyResult._sum),
      pendingPayouts: calcRevenue(pendingResult._sum),
      recentTransactions: recentBookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        date: b.date.toISOString(),
        serviceType: b.serviceType,
        status: b.status,
        totalPrice: b.totalPrice.toString(),
        bookingFee: b.bookingFee.toString(),
        revenue: (Number(b.totalPrice) - Number(b.bookingFee)).toFixed(2),
        clientName:
          `${b.client.firstName || ""} ${b.client.lastName || ""}`.trim() ||
          "Client",
      })),
    });
  } catch (error) {
    logger.error("Earnings error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
