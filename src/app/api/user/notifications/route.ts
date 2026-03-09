import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const since = req.nextUrl.searchParams.get("since");
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [statusChanges, unreadMessages] = await Promise.all([
      // Bookings where status changed since timestamp (accepted, rejected, completed)
      db.booking.count({
        where: {
          clientId: userId,
          status: { in: ["ACCEPTED", "REJECTED", "COMPLETED"] },
          updatedAt: { gt: sinceDate },
        },
      }),
      // Unread messages from therapists
      db.message.count({
        where: {
          booking: { clientId: userId },
          senderId: { not: userId },
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({ statusChanges, unreadMessages });
  } catch (error) {
    logger.error("Error fetching client notifications:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
