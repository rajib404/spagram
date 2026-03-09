import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { Prisma } from "@prisma/client";

const PER_PAGE = 20;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get("page") || "1"));
    const search = params.get("search") || "";
    const role = params.get("role") || "";

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && ["CLIENT", "THERAPIST", "ADMIN"].includes(role)) {
      where.role = role as "CLIENT" | "THERAPIST" | "ADMIN";
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          image: true,
          createdAt: true,
          lastActiveAt: true,
          therapistProfile: {
            select: { id: true, displayName: true, isActive: true, isVerified: true },
          },
          _count: { select: { bookings: true, reviews: true } },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: [u.firstName, u.lastName].filter(Boolean).join(" ") || null,
        phone: u.phone,
        role: u.role,
        image: u.image,
        createdAt: u.createdAt.toISOString(),
        lastActiveAt: u.lastActiveAt?.toISOString() ?? null,
        therapistProfile: u.therapistProfile
          ? {
              id: u.therapistProfile.id,
              displayName: u.therapistProfile.displayName,
              isActive: u.therapistProfile.isActive,
              isVerified: u.therapistProfile.isVerified,
            }
          : null,
        bookingCount: u._count.bookings,
        reviewCount: u._count.reviews,
      })),
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
    });
  } catch (error) {
    logger.error("Error fetching admin users:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
