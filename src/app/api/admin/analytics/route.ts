import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const now = new Date();

    // Registrations per month (last 12 months)
    const registrations = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = start.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      const [clients, therapists] = await Promise.all([
        db.user.count({ where: { role: "CLIENT", createdAt: { gte: start, lt: end } } }),
        db.user.count({ where: { role: "THERAPIST", createdAt: { gte: start, lt: end } } }),
      ]);

      registrations.push({ month: label, clients, therapists, total: clients + therapists });
    }

    // Bookings per month (last 12 months)
    const bookingsOverTime = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = start.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      const count = await db.booking.count({
        where: { createdAt: { gte: start, lt: end } },
      });

      bookingsOverTime.push({ month: label, count });
    }

    // Popular service types
    const serviceTypeCounts = await db.booking.groupBy({
      by: ["serviceType"],
      _count: { _all: true },
      orderBy: { _count: { serviceType: "desc" } },
      take: 10,
    });

    const popularServices = serviceTypeCounts.map((s) => ({
      serviceType: s.serviceType,
      count: s._count._all,
    }));

    // Popular locations
    const locationCounts = await db.therapistProfile.groupBy({
      by: ["state"],
      _count: { _all: true },
      where: { isActive: true, state: { not: null } },
      orderBy: { _count: { state: "desc" } },
      take: 10,
    });

    const popularLocations = locationCounts.map((l) => ({
      state: l.state ?? "Unknown",
      count: l._count._all,
    }));

    // Booking conversion rate
    const totalBookings = await db.booking.count();
    const completedBookings = await db.booking.count({ where: { status: "COMPLETED" } });
    const acceptedBookings = await db.booking.count({ where: { status: "ACCEPTED" } });
    const cancelledBookings = await db.booking.count({ where: { status: "CANCELLED" } });
    const rejectedBookings = await db.booking.count({ where: { status: "REJECTED" } });

    return NextResponse.json({
      registrations,
      bookingsOverTime,
      popularServices,
      popularLocations,
      conversionRates: {
        total: totalBookings,
        completed: completedBookings,
        accepted: acceptedBookings,
        cancelled: cancelledBookings,
        rejected: rejectedBookings,
        completionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : "0",
        acceptanceRate: totalBookings > 0 ? (((acceptedBookings + completedBookings) / totalBookings) * 100).toFixed(1) : "0",
      },
    });
  } catch (error) {
    logger.error("Error fetching admin analytics:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
