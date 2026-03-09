import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await db.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        therapistProfile: {
          select: {
            id: true,
            displayName: true,
            slug: true,
            profilePhoto: true,
            tagline: true,
            city: true,
            state: true,
            rating: true,
            reviewCount: true,
            massageTypes: true,
            incallAvailable: true,
            outcallAvailable: true,
            incallPricePerHour: true,
            outcallPricePerHour: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      favorites: favorites.map((f) => ({
        id: f.id,
        therapistProfileId: f.therapistProfileId,
        createdAt: f.createdAt.toISOString(),
        therapist: {
          id: f.therapistProfile.id,
          displayName: f.therapistProfile.displayName,
          slug: f.therapistProfile.slug,
          profilePhoto: f.therapistProfile.profilePhoto,
          tagline: f.therapistProfile.tagline,
          city: f.therapistProfile.city,
          state: f.therapistProfile.state,
          rating: f.therapistProfile.rating,
          reviewCount: f.therapistProfile.reviewCount,
          massageTypes: f.therapistProfile.massageTypes,
          incallAvailable: f.therapistProfile.incallAvailable,
          outcallAvailable: f.therapistProfile.outcallAvailable,
          incallPricePerHour: f.therapistProfile.incallPricePerHour?.toString() || null,
          outcallPricePerHour: f.therapistProfile.outcallPricePerHour?.toString() || null,
          isVerified: f.therapistProfile.isVerified,
        },
      })),
    });
  } catch (error) {
    logger.error("Get user favorites error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}
