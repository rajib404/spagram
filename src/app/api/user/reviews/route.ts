import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendNewReviewToTherapist } from "@/lib/email";
import { reviewSchema } from "@/lib/validations";
import { sanitize } from "@/lib/utils";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviews = await db.review.findMany({
      where: { clientId: session.user.id },
      include: {
        booking: {
          select: {
            bookingNumber: true,
            date: true,
            serviceType: true,
          },
        },
        therapistProfile: {
          select: {
            displayName: true,
            slug: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        bookingId: r.bookingId,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        therapistResponse: r.therapistResponse,
        createdAt: r.createdAt.toISOString(),
        booking: {
          bookingNumber: r.booking.bookingNumber,
          date: r.booking.date.toISOString(),
          serviceType: r.booking.serviceType,
        },
        therapist: {
          displayName: r.therapistProfile.displayName,
          slug: r.therapistProfile.slug,
          profilePhoto: r.therapistProfile.profilePhoto,
        },
      })),
    });
  } catch (error) {
    logger.error("Get user reviews error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { bookingId, rating } = parsed.data;
    const title = parsed.data.title ? sanitize(parsed.data.title) : null;
    const comment = parsed.data.comment ? sanitize(parsed.data.comment) : null;

    // Verify booking belongs to user and is completed
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        clientId: true,
        therapistProfileId: true,
        status: true,
        date: true,
        serviceType: true,
        review: { select: { id: true } },
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

    if (booking.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only review your own bookings" },
        { status: 403 }
      );
    }

    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "You can only review completed bookings" },
        { status: 400 }
      );
    }

    if (booking.review) {
      return NextResponse.json(
        { error: "You have already reviewed this booking" },
        { status: 409 }
      );
    }

    const review = await db.review.create({
      data: {
        bookingId,
        clientId: session.user.id,
        therapistProfileId: booking.therapistProfileId,
        rating,
        title: title || null,
        comment: comment || null,
      },
    });

    // Update therapist aggregate rating
    const stats = await db.review.aggregate({
      where: { therapistProfileId: booking.therapistProfileId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await db.therapistProfile.update({
      where: { id: booking.therapistProfileId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.rating,
      },
    });

    // Send notification email to therapist
    const client = await db.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });
    const clientName = [client?.firstName, client?.lastName].filter(Boolean).join(" ") || "A client";

    sendNewReviewToTherapist({
      therapistName: booking.therapistProfile.displayName,
      therapistEmail: booking.therapistProfile.user?.email || "",
      clientName,
      rating,
      title: title || null,
      comment: comment || null,
      serviceName: booking.serviceType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
      sessionDate: booking.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    }).catch((err) => logger.error("Failed to send review notification:", { error: err instanceof Error ? err.message : String(err) }));

    return NextResponse.json({ review: { id: review.id } }, { status: 201 });
  } catch (error) {
    logger.error("Create review error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId, rating, title, comment } = await req.json();

    if (!reviewId || !rating) {
      return NextResponse.json(
        { error: "Review ID and rating are required" },
        { status: 400 }
      );
    }

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { clientId: true, therapistProfileId: true },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (review.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own reviews" },
        { status: 403 }
      );
    }

    await db.review.update({
      where: { id: reviewId },
      data: {
        rating,
        title: title || null,
        comment: comment || null,
      },
    });

    // Update therapist aggregate rating
    const stats = await db.review.aggregate({
      where: { therapistProfileId: review.therapistProfileId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await db.therapistProfile.update({
      where: { id: review.therapistProfileId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.rating,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Update review error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = await req.json();

    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: { clientId: true, therapistProfileId: true },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (review.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own reviews" },
        { status: 403 }
      );
    }

    await db.review.delete({ where: { id: reviewId } });

    // Update therapist aggregate rating
    const stats = await db.review.aggregate({
      where: { therapistProfileId: review.therapistProfileId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await db.therapistProfile.update({
      where: { id: review.therapistProfileId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.rating,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete review error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
