import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const [upcomingBookings, pendingCount, totalBookings, recentActivity] =
      await Promise.all([
        db.booking.findMany({
          where: {
            clientId: userId,
            status: "ACCEPTED",
            date: { gte: new Date(todayStr) },
          },
          include: {
            therapistProfile: {
              select: {
                displayName: true,
                slug: true,
                profilePhoto: true,
                city: true,
                state: true,
              },
            },
          },
          orderBy: { date: "asc" },
          take: 3,
        }),
        db.booking.count({
          where: { clientId: userId, status: "PENDING" },
        }),
        db.booking.count({
          where: { clientId: userId },
        }),
        db.booking.findMany({
          where: { clientId: userId },
          include: {
            therapistProfile: {
              select: { displayName: true, slug: true },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),
      ]);

    return NextResponse.json({
      upcomingBookings: upcomingBookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        date: b.date.toISOString(),
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.duration,
        serviceType: b.serviceType,
        locationType: b.locationType,
        totalPrice: b.totalPrice.toString(),
        status: b.status,
        therapist: {
          displayName: b.therapistProfile.displayName,
          slug: b.therapistProfile.slug,
          profilePhoto: b.therapistProfile.profilePhoto,
          city: b.therapistProfile.city,
          state: b.therapistProfile.state,
        },
      })),
      pendingCount,
      totalBookings,
      recentActivity: recentActivity.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        status: b.status,
        updatedAt: b.updatedAt.toISOString(),
        therapistName: b.therapistProfile.displayName,
        therapistSlug: b.therapistProfile.slug,
      })),
    });
  } catch (error) {
    logger.error("User stats error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
