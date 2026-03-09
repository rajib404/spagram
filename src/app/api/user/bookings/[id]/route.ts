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
    if (!session?.user?.id) {
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
        clientId: true,
        createdAt: true,
        therapistProfile: {
          select: {
            displayName: true,
            slug: true,
            profilePhoto: true,
            city: true,
            state: true,
            userId: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.clientId !== session.user.id) {
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
        createdAt: booking.createdAt.toISOString(),
        therapist: {
          displayName: booking.therapistProfile.displayName,
          slug: booking.therapistProfile.slug,
          profilePhoto: booking.therapistProfile.profilePhoto,
          city: booking.therapistProfile.city,
          state: booking.therapistProfile.state,
        },
        therapistUserId: booking.therapistProfile.userId,
      },
    });
  } catch (error) {
    logger.error("Error fetching user booking detail:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}
