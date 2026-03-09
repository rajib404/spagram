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
        serviceType: true,
        status: true,
        clientId: true,
        therapistProfile: {
          select: {
            displayName: true,
            slug: true,
            profilePhoto: true,
          },
        },
        review: { select: { id: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.clientId !== session.user.id) {
      return NextResponse.json({ error: "Not your booking" }, { status: 403 });
    }

    return NextResponse.json({
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      date: booking.date.toISOString(),
      serviceType: booking.serviceType,
      status: booking.status,
      therapist: {
        displayName: booking.therapistProfile.displayName,
        slug: booking.therapistProfile.slug,
        profilePhoto: booking.therapistProfile.profilePhoto,
      },
      hasReview: !!booking.review,
    });
  } catch (error) {
    logger.error("Get booking review info error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to load booking" },
      { status: 500 }
    );
  }
}
