import Stripe from "stripe";
import { db } from "@/lib/db";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
    typescript: true,
  });
}

export { getStripe };

/**
 * Create a PaymentIntent with manual capture (authorize-only).
 * We only charge the booking fee (10% of total), not the full session price.
 */
export async function createBookingPaymentIntent({
  amountInCents,
  metadata,
  customerId,
  idempotencyKey,
}: {
  amountInCents: number;
  metadata: Record<string, string>;
  customerId?: string;
  idempotencyKey?: string;
}) {
  return getStripe().paymentIntents.create(
    {
      amount: amountInCents,
      currency: "usd",
      capture_method: "manual",
      metadata,
      ...(customerId && { customer: customerId }),
    },
    idempotencyKey ? { idempotencyKey } : undefined
  );
}

/**
 * Capture a previously authorized PaymentIntent (charge the card).
 */
export async function capturePaymentIntent(
  paymentIntentId: string,
  idempotencyKey?: string
) {
  return getStripe().paymentIntents.capture(
    paymentIntentId,
    undefined,
    idempotencyKey ? { idempotencyKey } : undefined
  );
}

/**
 * Cancel a PaymentIntent (release the hold without charging).
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
  idempotencyKey?: string
) {
  return getStripe().paymentIntents.cancel(
    paymentIntentId,
    undefined,
    idempotencyKey ? { idempotencyKey } : undefined
  );
}

/**
 * Refund a captured PaymentIntent.
 */
export async function refundPaymentIntent(
  paymentIntentId: string,
  idempotencyKey?: string
) {
  return getStripe().refunds.create(
    { payment_intent: paymentIntentId },
    idempotencyKey ? { idempotencyKey } : undefined
  );
}

// ─── Stripe Customer Management ────────────────────────────────────────────────

export async function createStripeCustomer(
  email: string,
  name: string,
  userId: string
) {
  return getStripe().customers.create({
    email,
    name,
    metadata: { userId },
  });
}

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, firstName: true, lastName: true },
  });

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Customer";
  const customer = await createStripeCustomer(user.email, name, userId);

  await db.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ─── Payment Method Management ─────────────────────────────────────────────────

export async function createSetupIntent(customerId: string) {
  return getStripe().setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
  });
}

export async function listPaymentMethods(customerId: string) {
  return getStripe().paymentMethods.list({
    customer: customerId,
    type: "card",
  });
}

export async function detachPaymentMethod(paymentMethodId: string) {
  return getStripe().paymentMethods.detach(paymentMethodId);
}

export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
) {
  return getStripe().customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
}
