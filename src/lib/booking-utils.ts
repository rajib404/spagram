import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Generate a unique booking number in the format SPA-XXXXX
 */
export async function generateBookingNumber(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let attempts = 0;

  while (attempts < 10) {
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const bookingNumber = `SPA-${code}`;

    const existing = await db.booking.findUnique({
      where: { bookingNumber },
      select: { id: true },
    });

    if (!existing) return bookingNumber;
    attempts++;
  }

  throw new Error("Failed to generate unique booking number");
}

/**
 * Build email data from a booking with relations
 */
export function buildBookingEmailData(
  booking: Prisma.BookingGetPayload<{
    include: {
      client: { select: { firstName: true; lastName: true; email: true } };
      therapistProfile: {
        select: {
          displayName: true;
          user: { select: { email: true } };
        };
      };
    };
  }>
) {
  const formattedDate = new Date(booking.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return {
    bookingNumber: booking.bookingNumber,
    clientName: `${booking.client.firstName || ""} ${booking.client.lastName || ""}`.trim() || "Client",
    clientEmail: booking.client.email,
    therapistName: booking.therapistProfile.displayName,
    therapistEmail: booking.therapistProfile.user.email,
    date: formattedDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    duration: booking.duration,
    serviceType: booking.serviceType,
    locationType: booking.locationType,
    outcallAddress: booking.outcallAddress,
    totalPrice: booking.totalPrice.toString(),
    bookingFee: booking.bookingFee.toString(),
    clientNotes: booking.clientNotes,
  };
}

/**
 * Fetch a booking with full relations needed for emails
 */
export async function getBookingWithRelations(bookingId: string) {
  return db.booking.findUnique({
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
}
