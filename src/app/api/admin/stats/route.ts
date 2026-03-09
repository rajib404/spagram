import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalTherapists,
      totalClients,
      pendingVerifications,
      totalBookings,
      bookingsThisMonth,
      revenueResult,
      feeIncomeResult,
      recentBookings,
      recentUsers,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "THERAPIST" } }),
      db.user.count({ where: { role: "CLIENT" } }),
      db.therapistProfile.count({ where: { isVerified: false, isActive: true } }),
      db.booking.count(),
      db.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.booking.aggregate({
        _sum: { totalPrice: true },
        where: { status: { in: ["ACCEPTED", "COMPLETED"] } },
      }),
      db.booking.aggregate({
        _sum: { bookingFee: true },
        where: { status: { in: ["ACCEPTED", "COMPLETED"] } },
      }),
      db.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          bookingNumber: true,
          status: true,
          totalPrice: true,
          createdAt: true,
          client: { select: { firstName: true, lastName: true } },
          therapistProfile: { select: { displayName: true } },
        },
      }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalTherapists,
      totalClients,
      pendingVerifications,
      totalBookings,
      bookingsThisMonth,
      totalRevenue: revenueResult._sum.totalPrice?.toString() ?? "0",
      totalFeeIncome: feeIncomeResult._sum.bookingFee?.toString() ?? "0",
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        totalPrice: b.totalPrice.toString(),
        createdAt: b.createdAt.toISOString(),
        clientName: [b.client.firstName, b.client.lastName].filter(Boolean).join(" ") || "Client",
        therapistName: b.therapistProfile.displayName,
      })),
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error("Error fetching admin stats:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
