import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { isVisible } = body;

    if (typeof isVisible !== "boolean") {
      return NextResponse.json({ error: "isVisible must be a boolean" }, { status: 400 });
    }

    const review = await db.review.update({
      where: { id: params.id },
      data: { isVisible },
      select: { therapistProfileId: true, rating: true },
    });

    // Recalculate therapist rating when toggling review visibility
    const stats = await db.review.aggregate({
      where: { therapistProfileId: review.therapistProfileId, isVisible: true },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await db.therapistProfile.update({
      where: { id: review.therapistProfileId },
      data: {
        rating: stats._avg.rating ?? 0,
        reviewCount: stats._count._all,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Error updating review:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
