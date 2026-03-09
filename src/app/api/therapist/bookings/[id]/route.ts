import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await db.booking.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        bookingNumber: true,
        date: true,
        startTime: true,
        endTime: true,
        duration: true,
        serviceType: true,
        locationType: true,
        outcallAddress: true,
        totalPrice: true,
        bookingFee: true,
        status: true,
        clientNotes: true,
        therapistNotes: true,
        therapistProfileId: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.therapistProfileId !== session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        date: booking.date.toISOString(),
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        serviceType: booking.serviceType,
        locationType: booking.locationType,
        outcallAddress: booking.outcallAddress,
        totalPrice: booking.totalPrice.toString(),
        bookingFee: booking.bookingFee.toString(),
        status: booking.status,
        clientNotes: booking.clientNotes,
        therapistNotes: booking.therapistNotes,
        createdAt: booking.createdAt.toISOString(),
        client: {
          id: booking.client.id,
          name: [booking.client.firstName, booking.client.lastName].filter(Boolean).join(" ") || "Client",
          email: booking.client.email,
          image: booking.client.image,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching therapist booking detail:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}
