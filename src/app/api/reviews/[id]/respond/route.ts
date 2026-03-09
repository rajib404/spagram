import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewResponseSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reviewId } = params;
    const body = await req.json();
    const parsed = reviewResponseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { response } = parsed.data;

    // Verify the review exists and belongs to therapist's profile
    const review = await db.review.findUnique({
      where: { id: reviewId },
      select: {
        therapistProfileId: true,
        therapistProfile: {
          select: { userId: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (review.therapistProfile.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only respond to reviews on your own profile" },
        { status: 403 }
      );
    }

    await db.review.update({
      where: { id: reviewId },
      data: { therapistResponse: response.trim() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Respond to review error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to respond to review" },
      { status: 500 }
    );
  }
}
