import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { therapistNotesSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = therapistNotesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { bookingId, notes } = parsed.data;

    // Verify booking belongs to this therapist
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { therapistProfileId: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.therapistProfileId !== session.user.therapistProfileId) {
      return NextResponse.json(
        { error: "You can only update notes on your own bookings" },
        { status: 403 }
      );
    }

    await db.booking.update({
      where: { id: bookingId },
      data: { therapistNotes: notes || null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Update booking notes error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to update notes" },
      { status: 500 }
    );
  }
}
