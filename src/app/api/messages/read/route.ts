import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { markMessagesReadSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = markMessagesReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { bookingId } = parsed.data;

    // Verify user is a participant
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        clientId: true,
        therapistProfile: { select: { userId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isClient = booking.clientId === session.user.id;
    const isTherapist = booking.therapistProfile.userId === session.user.id;
    if (!isClient && !isTherapist) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Mark messages from the other party as read
    await db.message.updateMany({
      where: {
        bookingId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Error marking messages as read:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 });
  }
}
