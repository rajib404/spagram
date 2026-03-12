import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createBookingPaymentIntent,
  getOrCreateStripeCustomer,
} from "@/lib/stripe";
import {
  sendBookingPendingToTherapist,
  sendBookingPendingToClient,
} from "@/lib/email";
import {
  generateBookingNumber,
  buildBookingEmailData,
} from "@/lib/booking-utils";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { createBookingSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { sanitize } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only clients can create bookings" },
        { status: 403 }
      );
    }

    if (!rateLimit(`booking:${session.user.id}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many booking attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const {
      therapistProfileId,
      date,
      startTime,
      endTime,
      duration,
      serviceType,
      locationType,
    } = parsed.data;
    const outcallAddress = parsed.data.outcallAddress ? sanitize(parsed.data.outcallAddress) : null;
    const clientNotes = parsed.data.clientNotes ? sanitize(parsed.data.clientNotes) : null;

    // Validate therapist exists and is active
    const therapist = await db.therapistProfile.findUnique({
      where: { id: therapistProfileId },
      select: {
        id: true,
        isActive: true,
        displayName: true,
        massageTypes: true,
        incallAvailable: true,
        outcallAvailable: true,
        incallPricePerHour: true,
        outcallPricePerHour: true,
        userId: true,
      },
    });

    if (!therapist || !therapist.isActive) {
      return NextResponse.json(
        { error: "Therapist not found or inactive" },
        { status: 404 }
      );
    }

    // Prevent booking yourself
    if (therapist.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot book yourself" },
        { status: 400 }
      );
    }

    // Validate service type
    if (!therapist.massageTypes.includes(serviceType)) {
      return NextResponse.json(
        { error: "This therapist doesn't offer that service" },
        { status: 400 }
      );
    }

    // Validate location type
    if (locationType === "INCALL" && !therapist.incallAvailable) {
      return NextResponse.json(
        { error: "Incall not available for this therapist" },
        { status: 400 }
      );
    }
    if (locationType === "OUTCALL" && !therapist.outcallAvailable) {
      return NextResponse.json(
        { error: "Outcall not available for this therapist" },
        { status: 400 }
      );
    }

    // Calculate pricing
    const hourlyRate =
      locationType === "INCALL"
        ? therapist.incallPricePerHour
        : therapist.outcallPricePerHour;

    if (!hourlyRate) {
      return NextResponse.json(
        { error: "Pricing not available" },
        { status: 400 }
      );
    }

    const totalPrice = new Prisma.Decimal(hourlyRate.toString())
      .mul(duration)
      .div(60);
    const bookingFee = totalPrice.mul(new Prisma.Decimal("0.10"));
    const bookingFeeInCents = Math.round(bookingFee.toNumber() * 100);

    // Get or create Stripe customer for this user
    const customerId = await getOrCreateStripeCustomer(session.user.id);

    // Check slot availability — prevent double-booking via transaction
    const bookingNumber = await generateBookingNumber();
    const acceptRejectToken = randomUUID();
    const idempotencyKey = randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const bookingDate = new Date(date);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Use transaction to prevent race conditions
    const { booking, clientSecret } = await db.$transaction(async (tx) => {
      // Check for conflicting bookings
      const conflicting = await tx.booking.findFirst({
        where: {
          therapistProfileId,
          date: { gte: dayStart, lte: dayEnd },
          status: { in: ["PENDING", "ACCEPTED"] },
          OR: [
            {
              // New booking starts during existing
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              // New booking ends during existing
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
            {
              // New booking contains existing
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } },
              ],
            },
          ],
        },
        select: { id: true },
      });

      if (conflicting) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      // Create Stripe PaymentIntent (authorize only)
      const paymentIntent = await createBookingPaymentIntent({
        amountInCents: bookingFeeInCents,
        metadata: {
          bookingNumber,
          clientId: session.user.id,
          therapistProfileId,
        },
        customerId,
        idempotencyKey,
      });

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          bookingNumber,
          clientId: session.user.id,
          therapistProfileId,
          date: bookingDate,
          startTime,
          endTime,
          duration,
          serviceType,
          locationType: locationType as "INCALL" | "OUTCALL",
          outcallAddress: locationType === "OUTCALL" ? outcallAddress : null,
          totalPrice,
          bookingFee,
          status: "PENDING",
          stripePaymentIntentId: paymentIntent.id,
          stripeIdempotencyKey: idempotencyKey,
          clientNotes: clientNotes || null,
          acceptRejectToken,
          tokenExpiresAt,
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

      return { booking: newBooking, clientSecret: paymentIntent.client_secret };
    });

    // Send emails (non-blocking)
    const emailData = buildBookingEmailData(booking);
    Promise.all([
      sendBookingPendingToTherapist(emailData, acceptRejectToken),
      sendBookingPendingToClient(emailData),
    ]).catch((err) => logger.error("Email send error:", { error: err instanceof Error ? err.message : String(err) }));

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          totalPrice: booking.totalPrice.toString(),
          bookingFee: booking.bookingFee.toString(),
          stripePaymentIntentId: booking.stripePaymentIntentId,
        },
        clientSecret,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "SLOT_UNAVAILABLE") {
      return NextResponse.json(
        { error: "This time slot is no longer available. Please select another time." },
        { status: 409 }
      );
    }
    logger.error("Create booking error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
