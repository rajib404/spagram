import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { cancelPaymentIntent, refundPaymentIntent } from "@/lib/stripe";
import { sendBookingCancelledToTherapist } from "@/lib/email";
import { buildBookingEmailData } from "@/lib/booking-utils";
import { bookingIdSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Only the client who created the booking (or admin) can cancel
    if (
      booking.clientId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You can only cancel your own bookings" },
        { status: 403 }
      );
    }

    // Wrap status check + Stripe action + DB update in transaction
    const updatedBooking = await db.$transaction(async (tx) => {
      const fresh = await tx.booking.findUnique({
        where: { id: booking.id },
        select: { status: true, stripePaymentIntentId: true },
      });

      if (!fresh || !["PENDING", "ACCEPTED"].includes(fresh.status)) {
        throw new Error("ALREADY_PROCESSED");
      }

      // Handle Stripe based on booking status
      if (fresh.stripePaymentIntentId) {
        try {
          if (fresh.status === "PENDING") {
            await cancelPaymentIntent(
              fresh.stripePaymentIntentId,
              `cancel-${booking.id}`
            );
          } else if (fresh.status === "ACCEPTED") {
            await refundPaymentIntent(
              fresh.stripePaymentIntentId,
              `cancel-refund-${booking.id}`
            );
          }
        } catch (stripeErr) {
          logger.error("Stripe cancel/refund failed (continuing with cancel)", {
            paymentIntentId: fresh.stripePaymentIntentId,
            error: stripeErr instanceof Error ? stripeErr.message : String(stripeErr),
          });
        }
      }

      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CANCELLED",
          acceptRejectToken: null,
          tokenExpiresAt: null,
        },
        include: {
          client: {
            select: { firstName: true, lastName: true, email: true },
          },
          therapistProfile: {
            select: {
              displayName: true,
              user: { select: { email: true } },
            },
          },
        },
      });
    });

    // Notify therapist (non-blocking)
    const emailData = buildBookingEmailData(updatedBooking);
    sendBookingCancelledToTherapist(emailData).catch((err) =>
      logger.error("Email send error", { error: err instanceof Error ? err.message : String(err) })
    );

    return NextResponse.json({
      message: "Booking cancelled",
      bookingNumber: updatedBooking.bookingNumber,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_PROCESSED") {
      return NextResponse.json(
        { error: "This booking can no longer be cancelled" },
        { status: 409 }
      );
    }
    logger.error("Cancel booking error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
