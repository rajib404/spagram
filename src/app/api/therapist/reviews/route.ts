import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const PER_PAGE = 10;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.therapistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, rating: true, reviewCount: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Therapist profile not found" },
        { status: 404 }
      );
    }

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1"));
    const ratingFilter = sp.get("rating") ? parseInt(sp.get("rating")!) : null;
    const sort = sp.get("sort") || "newest";

    const where: Record<string, unknown> = {
      therapistProfileId: profile.id,
      isVisible: true,
    };

    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      where.rating = ratingFilter;
    }

    const orderBy =
      sort === "highest"
        ? { rating: "desc" as const }
        : sort === "lowest"
        ? { rating: "asc" as const }
        : { createdAt: "desc" as const };

    const [reviews, total, distribution] = await Promise.all([
      db.review.findMany({
        where,
        orderBy,
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          therapistResponse: true,
          createdAt: true,
          client: {
            select: { firstName: true, lastName: true, image: true },
          },
          booking: {
            select: {
              bookingNumber: true,
              date: true,
              serviceType: true,
            },
          },
        },
      }),
      db.review.count({ where }),
      db.review.groupBy({
        by: ["rating"],
        where: { therapistProfileId: profile.id, isVisible: true },
        _count: { rating: true },
      }),
    ]);

    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) {
      dist[d.rating] = d._count.rating;
    }

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        therapistResponse: r.therapistResponse,
        createdAt: r.createdAt.toISOString(),
        client: {
          name: [r.client.firstName, r.client.lastName].filter(Boolean).join(" ") || "Anonymous",
          image: r.client.image,
        },
        booking: {
          bookingNumber: r.booking.bookingNumber,
          date: r.booking.date.toISOString(),
          serviceType: r.booking.serviceType,
        },
      })),
      pagination: {
        page,
        limit: PER_PAGE,
        total,
        totalPages: Math.ceil(total / PER_PAGE),
      },
      summary: {
        averageRating: profile.rating,
        totalReviews: profile.reviewCount,
        distribution: dist,
      },
    });
  } catch (error) {
    logger.error("Get therapist reviews error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
