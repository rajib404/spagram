import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileId = session.user.therapistProfileId;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      bookingsThisMonth,
      upcomingBookings,
      profile,
      revenueResult,
      recentReviews,
    ] = await Promise.all([
      // Total bookings this month
      db.booking.count({
        where: {
          therapistProfileId: profileId,
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ["PENDING", "ACCEPTED", "COMPLETED"] },
        },
      }),

      // Upcoming bookings (next 5)
      db.booking.findMany({
        where: {
          therapistProfileId: profileId,
          date: { gte: now },
          status: { in: ["PENDING", "ACCEPTED"] },
        },
        include: {
          client: {
            select: { firstName: true, lastName: true, image: true },
          },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 5,
      }),

      // Profile for rating + completion
      db.therapistProfile.findUnique({
        where: { id: profileId },
        include: {
          availability: { select: { id: true } },
        },
      }),

      // Revenue this month (sum of booking fees for completed/accepted bookings)
      db.booking.aggregate({
        where: {
          therapistProfileId: profileId,
          status: { in: ["ACCEPTED", "COMPLETED"] },
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { totalPrice: true },
      }),

      // Recent reviews (last 3)
      db.review.findMany({
        where: { therapistProfileId: profileId, isVisible: true },
        include: {
          client: {
            select: { firstName: true, lastName: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

    // Calculate profile completion
    const completionFields = [
      profile?.displayName,
      profile?.bio,
      profile?.tagline,
      profile?.profilePhoto,
      (profile?.galleryPhotos?.length ?? 0) > 0,
      profile?.gender,
      profile?.state,
      profile?.city,
      profile?.massageTypes && profile.massageTypes.length > 0,
      profile?.incallPricePerHour || profile?.outcallPricePerHour,
      (profile?.availability?.length ?? 0) > 0,
    ];

    const filledCount = completionFields.filter(Boolean).length;
    const completionPercent = Math.round((filledCount / completionFields.length) * 100);

    return NextResponse.json({
      bookingsThisMonth,
      upcomingCount: upcomingBookings.length,
      averageRating: profile?.rating ?? 0,
      reviewCount: profile?.reviewCount ?? 0,
      revenueThisMonth: revenueResult._sum.totalPrice?.toString() ?? "0",
      profileCompletion: completionPercent,
      upcomingBookings: upcomingBookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        date: b.date.toISOString(),
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.duration,
        serviceType: b.serviceType,
        locationType: b.locationType,
        status: b.status,
        totalPrice: b.totalPrice.toString(),
        clientName:
          `${b.client.firstName || ""} ${b.client.lastName || ""}`.trim() ||
          "Client",
        clientImage: b.client.image,
        acceptRejectToken: b.acceptRejectToken,
      })),
      recentReviews: recentReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        clientName:
          `${r.client.firstName || ""} ${r.client.lastName || ""}`.trim() ||
          "Client",
        clientImage: r.client.image,
        therapistResponse: r.therapistResponse,
      })),
    });
  } catch (error) {
    logger.error("Stats error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
