import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const PER_PAGE = 5;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const page = Math.max(
      1,
      parseInt(req.nextUrl.searchParams.get("page") || "1")
    );
    const skip = (page - 1) * PER_PAGE;

    const where = {
      therapistProfileId: id,
      isVisible: true,
    };

    const [reviews, total, distribution] = await Promise.all([
      db.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
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
        },
      }),
      db.review.count({ where }),
      // Rating distribution
      db.review.groupBy({
        by: ["rating"],
        where,
        _count: { rating: true },
      }),
    ]);

    // Build distribution map
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const d of distribution) {
      dist[d.rating] = d._count.rating;
    }

    const response = NextResponse.json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
      distribution: dist,
    });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
    return response;
  } catch (error) {
    logger.error("Error fetching reviews", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
