import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = req.nextUrl.searchParams;

    const tab = searchParams.get("tab") || "upcoming";
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    let statusFilter: Prisma.BookingWhereInput;
    switch (tab) {
      case "upcoming":
        statusFilter = {
          status: "ACCEPTED",
          date: { gte: new Date(todayStr) },
        };
        break;
      case "pending":
        statusFilter = { status: "PENDING" };
        break;
      case "past":
        statusFilter = {
          OR: [
            { status: "COMPLETED" },
            { status: "ACCEPTED", date: { lt: new Date(todayStr) } },
          ],
        };
        break;
      case "cancelled":
        statusFilter = {
          status: { in: ["CANCELLED", "REJECTED"] },
        };
        break;
      default:
        statusFilter = {};
    }

    let searchFilter: Prisma.BookingWhereInput = {};
    if (search) {
      searchFilter = {
        OR: [
          { bookingNumber: { contains: search, mode: "insensitive" } },
          {
            therapistProfile: {
              displayName: { contains: search, mode: "insensitive" },
            },
          },
        ],
      };
    }

    const where: Prisma.BookingWhereInput = {
      clientId: userId,
      ...statusFilter,
      ...searchFilter,
    };

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          therapistProfile: {
            select: {
              id: true,
              displayName: true,
              slug: true,
              profilePhoto: true,
              city: true,
              state: true,
            },
          },
          review: {
            select: {
              id: true,
              rating: true,
              title: true,
              comment: true,
            },
          },
        },
        orderBy:
          tab === "upcoming"
            ? { date: "asc" }
            : tab === "pending"
              ? { createdAt: "desc" }
              : { date: "desc" },
        skip,
        take: limit,
      }),
      db.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        date: b.date.toISOString(),
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.duration,
        serviceType: b.serviceType,
        locationType: b.locationType,
        outcallAddress: b.outcallAddress,
        totalPrice: b.totalPrice.toString(),
        bookingFee: b.bookingFee.toString(),
        status: b.status,
        clientNotes: b.clientNotes,
        createdAt: b.createdAt.toISOString(),
        therapist: {
          id: b.therapistProfile.id,
          displayName: b.therapistProfile.displayName,
          slug: b.therapistProfile.slug,
          profilePhoto: b.therapistProfile.profilePhoto,
          city: b.therapistProfile.city,
          state: b.therapistProfile.state,
        },
        review: b.review
          ? {
              id: b.review.id,
              rating: b.review.rating,
              title: b.review.title,
              comment: b.review.comment,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Get user bookings error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
