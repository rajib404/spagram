import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendBookingCompletedToClient } from "@/lib/email";
import { buildBookingEmailData } from "@/lib/booking-utils";
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
        { error: "Only therapists can mark bookings as complete" },
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
        client: {
          select: { firstName: true, lastName: true, email: true },
        },
        therapistProfile: {
          select: {
            displayName: true,
            incallAddress: true,
            userId: true,
            user: { select: { email: true } },
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

    // Only the therapist who owns the booking (or admin) can complete it
    if (
      booking.therapistProfile.userId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You can only complete your own bookings" },
        { status: 403 }
      );
    }

    if (booking.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: `Cannot complete a ${booking.status.toLowerCase()} booking` },
        { status: 409 }
      );
    }

    // Update booking status
    const updatedBooking = await db.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED" },
      include: {
        client: {
          select: { firstName: true, lastName: true, email: true },
        },
        therapistProfile: {
          select: {
            displayName: true,
            incallAddress: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    // Send review request email to client (non-blocking)
    const emailData = buildBookingEmailData(updatedBooking);
    sendBookingCompletedToClient(emailData, booking.id).catch((err) =>
      logger.error("Email send error", { error: err instanceof Error ? err.message : String(err) })
    );

    return NextResponse.json({
      message: "Booking marked as complete",
      bookingNumber: updatedBooking.bookingNumber,
    });
  } catch (error) {
    logger.error("Complete booking error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to complete booking" },
      { status: 500 }
    );
  }
}
