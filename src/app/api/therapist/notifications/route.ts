import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileId = session.user.therapistProfileId;
    const since = req.nextUrl.searchParams.get("since");
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [newBookings, changedBookings, unreadMessages] = await Promise.all([
      // New bookings since timestamp
      db.booking.count({
        where: {
          therapistProfileId: profileId,
          status: "PENDING",
          createdAt: { gt: sinceDate },
        },
      }),
      // Bookings that changed status (cancelled by client) since timestamp
      db.booking.count({
        where: {
          therapistProfileId: profileId,
          status: "CANCELLED",
          updatedAt: { gt: sinceDate },
        },
      }),
      // Unread messages from clients
      db.message.count({
        where: {
          booking: { therapistProfileId: profileId },
          senderId: { not: session.user.id },
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({ newBookings, changedBookings, unreadMessages });
  } catch (error) {
    logger.error("Error fetching therapist notifications:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
