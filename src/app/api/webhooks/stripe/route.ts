import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const start = Date.now();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.error("Webhook signature verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  logger.stripeEvent(event.type, { eventId: event.id });

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const booking = await db.booking.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
          select: { id: true, bookingNumber: true },
        });
        if (booking) {
          logger.stripeEvent("payment_intent.succeeded", {
            bookingNumber: booking.bookingNumber,
            paymentIntentId: paymentIntent.id,
          });
        }
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const booking = await db.booking.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
          select: { id: true, status: true },
        });

        if (booking && booking.status === "PENDING") {
          await db.booking.update({
            where: { id: booking.id },
            data: {
              status: "CANCELLED",
              acceptRejectToken: null,
              tokenExpiresAt: null,
            },
          });
          logger.stripeEvent("payment_intent.canceled", {
            bookingId: booking.id,
            action: "booking_cancelled",
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const booking = await db.booking.findFirst({
          where: { stripePaymentIntentId: paymentIntent.id },
          select: { id: true, status: true },
        });

        if (booking && booking.status === "PENDING") {
          await db.booking.update({
            where: { id: booking.id },
            data: {
              status: "CANCELLED",
              acceptRejectToken: null,
              tokenExpiresAt: null,
            },
          });
          logger.stripeEvent("payment_intent.payment_failed", {
            bookingId: booking.id,
            action: "booking_cancelled",
          });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;

        if (piId) {
          const booking = await db.booking.findFirst({
            where: { stripePaymentIntentId: piId },
            select: { id: true, bookingNumber: true },
          });
          if (booking) {
            logger.stripeEvent("charge.refunded", {
              bookingNumber: booking.bookingNumber,
              amountRefunded: charge.amount_refunded,
            });
          }
        }
        break;
      }

      case "charge.refund.updated": {
        const refund = event.data.object as Stripe.Refund;
        logger.stripeEvent("charge.refund.updated", {
          refundId: refund.id,
          refundStatus: refund.status,
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    logger.error(`Webhook handler error for ${event.type}`, {
      eventType: event.type,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const durationMs = Date.now() - start;
  logger.apiTiming("POST", "/api/webhooks/stripe", 200, durationMs);

  return NextResponse.json({ received: true });
}
