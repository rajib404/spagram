import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileId = session.user.therapistProfileId;
    const searchParams = req.nextUrl.searchParams;

    const tab = searchParams.get("tab") || "pending";
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // Build status filter based on tab
    let statusFilter: Prisma.BookingWhereInput;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    switch (tab) {
      case "pending":
        statusFilter = { status: "PENDING" };
        break;
      case "upcoming":
        statusFilter = {
          status: "ACCEPTED",
          date: { gte: new Date(todayStr) },
        };
        break;
      case "past":
        statusFilter = {
          OR: [
            { status: "COMPLETED" },
            {
              status: "ACCEPTED",
              date: { lt: new Date(todayStr) },
            },
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

    // Build search filter
    let searchFilter: Prisma.BookingWhereInput = {};
    if (search) {
      searchFilter = {
        OR: [
          { bookingNumber: { contains: search, mode: "insensitive" } },
          {
            client: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      };
    }

    // Build date range filter
    let dateFilter: Prisma.BookingWhereInput = {};
    if (dateFrom) {
      dateFilter = { ...dateFilter, date: { ...((dateFilter.date as object) || {}), gte: new Date(dateFrom) } };
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      dateFilter = {
        date: {
          ...((dateFilter.date as object) || {}),
          lte: endDate,
        },
      };
    }
    if (dateFrom && dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      dateFilter = {
        date: {
          gte: new Date(dateFrom),
          lte: endDate,
        },
      };
    }

    const where: Prisma.BookingWhereInput = {
      therapistProfileId: profileId,
      ...statusFilter,
      ...searchFilter,
      ...dateFilter,
    };

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              image: true,
            },
          },
          review: {
            select: {
              id: true,
              rating: true,
              comment: true,
            },
          },
        },
        orderBy: tab === "pending"
          ? { createdAt: "asc" }
          : tab === "upcoming"
            ? { date: "asc" }
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
        therapistNotes: b.therapistNotes,
        acceptRejectToken: b.acceptRejectToken,
        tokenExpiresAt: b.tokenExpiresAt?.toISOString() || null,
        createdAt: b.createdAt.toISOString(),
        client: {
          id: b.client.id,
          name: `${b.client.firstName || ""} ${b.client.lastName || ""}`.trim() || "Client",
          email: b.client.email,
          image: b.client.image,
        },
        review: b.review
          ? {
              id: b.review.id,
              rating: b.review.rating,
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
    logger.error("Get therapist bookings error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
