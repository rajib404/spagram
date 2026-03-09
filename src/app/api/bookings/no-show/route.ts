import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookingIdSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "THERAPIST" &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Only therapists can mark bookings as no-show" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = bookingIdSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { bookingId } = parsed.data;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        therapistProfile: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Only the therapist who owns the booking (or admin) can mark no-show
    if (
      booking.therapistProfile.userId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You can only mark your own bookings as no-show" },
        { status: 403 }
      );
    }

    if (booking.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: `Cannot mark a ${booking.status.toLowerCase()} booking as no-show` },
        { status: 409 }
      );
    }

    // Update booking status — no Stripe action needed (fee already captured on accept)
    await db.booking.update({
      where: { id: booking.id },
      data: { status: "NO_SHOW" },
    });

    return NextResponse.json({
      message: "Booking marked as no-show",
      bookingNumber: booking.bookingNumber,
    });
  } catch (error) {
    logger.error("No-show booking error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to mark booking as no-show" },
      { status: 500 }
    );
  }
}
