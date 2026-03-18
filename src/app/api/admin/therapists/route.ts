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
    const filter = params.get("filter") || ""; // "pending", "verified", "unverified", "inactive"

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    switch (filter) {
      case "pending":
        where.isVerified = false;
        where.isActive = true;
        break;
      case "verified":
        where.isVerified = true;
        break;
      case "unverified":
        where.isVerified = false;
        break;
      case "active":
        where.isActive = true;
        break;
      case "inactive":
        where.isActive = false;
        break;
    }

    const [therapists, total] = await Promise.all([
      db.therapistProfile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
        select: {
          id: true,
          displayName: true,
          slug: true,
          profilePhoto: true,
          state: true,
          city: true,
          isVerified: true,
          isActive: true,
          rating: true,
          reviewCount: true,
          massageTypes: true,
          galleryPhotos: true,
          createdAt: true,
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          _count: { select: { bookings: true } },
        },
      }),
      db.therapistProfile.count({ where }),
    ]);

    return NextResponse.json({
      therapists: therapists.map((t) => ({
        id: t.id,
        displayName: t.displayName,
        slug: t.slug,
        profilePhoto: t.profilePhoto,
        state: t.state,
        city: t.city,
        isVerified: t.isVerified,
        isActive: t.isActive,
        rating: t.rating,
        reviewCount: t.reviewCount,
        massageTypes: t.massageTypes,
        galleryPhotos: t.galleryPhotos,
        createdAt: t.createdAt.toISOString(),
        userId: t.user.id,
        userEmail: t.user.email,
        userName: [t.user.firstName, t.user.lastName].filter(Boolean).join(" ") || null,
        bookingCount: t._count.bookings,
      })),
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
    });
  } catch (error) {
    logger.error("Error fetching admin therapists:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to fetch therapists" }, { status: 500 });
  }
}
