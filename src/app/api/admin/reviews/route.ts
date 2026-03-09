import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const PER_PAGE = 20;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get("page") || "1"));
    const search = params.get("search") || "";
    const filter = params.get("filter") || ""; // "visible", "hidden", "low-rating"

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { comment: { contains: search, mode: "insensitive" } },
        { client: { firstName: { contains: search, mode: "insensitive" } } },
        { therapistProfile: { displayName: { contains: search, mode: "insensitive" } } },
      ];
    }

    switch (filter) {
      case "visible":
        where.isVisible = true;
        break;
      case "hidden":
        where.isVisible = false;
        break;
      case "low-rating":
        where.rating = { lte: 2 };
        break;
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          isVisible: true,
          therapistResponse: true,
          createdAt: true,
          client: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          therapistProfile: {
            select: { id: true, displayName: true },
          },
          booking: {
            select: { bookingNumber: true },
          },
        },
      }),
      db.review.count({ where }),
    ]);

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        isVisible: r.isVisible,
        therapistResponse: r.therapistResponse,
        createdAt: r.createdAt.toISOString(),
        clientName: [r.client.firstName, r.client.lastName].filter(Boolean).join(" ") || r.client.email,
        clientEmail: r.client.email,
        therapistName: r.therapistProfile.displayName,
        bookingNumber: r.booking.bookingNumber,
      })),
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
    });
  } catch (error) {
    logger.error("Error fetching admin reviews:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
