import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { capturePaymentIntent } from "@/lib/stripe";
import { sendBookingAcceptedToClient } from "@/lib/email";
import { buildBookingEmailData } from "@/lib/booking-utils";
import { bookingActionSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bookingActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { token, bookingId } = parsed.data;

    let booking;

    if (token) {
      // Token-based auth (from email link)
      booking = await db.booking.findUnique({
        where: { acceptRejectToken: token },
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
          { error: "Invalid or expired token" },
          { status: 404 }
        );
      }

      if (booking.tokenExpiresAt && booking.tokenExpiresAt < new Date()) {
        return NextResponse.json(
          { error: "This link has expired" },
          { status: 410 }
        );
      }
    } else {
      // Session-based auth (from dashboard)
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (session.user.role !== "THERAPIST" && session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only therapists can accept bookings" },
          { status: 403 }
        );
      }

      booking = await db.booking.findUnique({
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

      if (
        booking.therapistProfile.userId !== session.user.id &&
        session.user.role !== "ADMIN"
      ) {
        return NextResponse.json(
          { error: "You can only accept your own bookings" },
          { status: 403 }
        );
      }
    }

    // Wrap status check + Stripe capture + DB update in transaction
    const updatedBooking = await db.$transaction(async (tx) => {
      // Re-fetch inside transaction for fresh status
      const fresh = await tx.booking.findUnique({
        where: { id: booking.id },
        select: { status: true, stripePaymentIntentId: true },
      });

      if (!fresh || fresh.status !== "PENDING") {
        throw new Error("ALREADY_PROCESSED");
      }

      // Capture Stripe PaymentIntent (idempotent)
      if (fresh.stripePaymentIntentId) {
        try {
          await capturePaymentIntent(
            fresh.stripePaymentIntentId,
            `accept-${booking.id}`
          );
        } catch (stripeErr) {
          logger.error("Stripe capture failed (continuing with accept)", {
            paymentIntentId: fresh.stripePaymentIntentId,
            error: stripeErr instanceof Error ? stripeErr.message : String(stripeErr),
          });
        }
      }

      // Update booking status and clear token
      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "ACCEPTED",
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
              incallAddress: true,
              user: { select: { email: true } },
            },
          },
        },
      });
    });

    // Send confirmation email to client (non-blocking)
    const emailData = buildBookingEmailData(updatedBooking);
    sendBookingAcceptedToClient(emailData).catch((err) =>
      logger.error("Email send error", { error: err instanceof Error ? err.message : String(err) })
    );

    return NextResponse.json({
      message: "Booking accepted",
      bookingNumber: updatedBooking.bookingNumber,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_PROCESSED") {
      return NextResponse.json(
        { error: "This booking has already been processed" },
        { status: 409 }
      );
    }
    logger.error("Accept booking error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to accept booking" },
      { status: 500 }
    );
  }
}
