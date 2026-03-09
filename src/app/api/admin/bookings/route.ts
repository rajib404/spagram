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
    const status = params.get("status") || "";
    const dateFrom = params.get("dateFrom") || "";
    const dateTo = params.get("dateTo") || "";
    const therapistId = params.get("therapistId") || "";

    const where: Prisma.BookingWhereInput = {};

    if (search) {
      where.OR = [
        { bookingNumber: { contains: search, mode: "insensitive" } },
        { client: { firstName: { contains: search, mode: "insensitive" } } },
        { client: { lastName: { contains: search, mode: "insensitive" } } },
        { client: { email: { contains: search, mode: "insensitive" } } },
        { therapistProfile: { displayName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status && ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED", "NO_SHOW"].includes(status)) {
      where.status = status as Prisma.EnumBookingStatusFilter;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (therapistId) {
      where.therapistProfileId = therapistId;
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PER_PAGE,
        take: PER_PAGE,
        select: {
          id: true,
          bookingNumber: true,
          date: true,
          startTime: true,
          endTime: true,
          duration: true,
          serviceType: true,
          locationType: true,
          totalPrice: true,
          bookingFee: true,
          status: true,
          createdAt: true,
          client: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          therapistProfile: {
            select: { id: true, displayName: true },
          },
        },
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
        totalPrice: b.totalPrice.toString(),
        bookingFee: b.bookingFee.toString(),
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        clientId: b.client.id,
        clientName: [b.client.firstName, b.client.lastName].filter(Boolean).join(" ") || b.client.email,
        clientEmail: b.client.email,
        therapistId: b.therapistProfile.id,
        therapistName: b.therapistProfile.displayName,
      })),
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
    });
  } catch (error) {
    logger.error("Error fetching admin bookings:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
