import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monthParam = req.nextUrl.searchParams.get("month"); // "YYYY-MM"
    const profileId = session.user.therapistProfileId;

    let dateFilter = {};
    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      dateFilter = { date: { gte: start, lte: end } };
    }

    const exceptions = await db.availabilityException.findMany({
      where: { therapistProfileId: profileId, ...dateFilter },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      exceptions: exceptions.map((e) => ({
        id: e.id,
        date: e.date.toISOString(),
        isAvailable: e.isAvailable,
        startTime: e.startTime,
        endTime: e.endTime,
        reason: e.reason,
      })),
    });
  } catch (error) {
    logger.error("Get exceptions error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch exceptions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileId = session.user.therapistProfileId;
    const body = await req.json();
    const { date, isAvailable, startTime, endTime, reason } = body;

    if (!date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const exceptionDate = new Date(date);
    if (isNaN(exceptionDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date" },
        { status: 400 }
      );
    }

    // Validate custom hours
    if (isAvailable && startTime && endTime) {
      if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
        return NextResponse.json(
          { error: "Invalid time format" },
          { status: 400 }
        );
      }

      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      if (eh * 60 + em <= sh * 60 + sm) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }
    }

    // Check for existing exception on the same date
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await db.availabilityException.findFirst({
      where: {
        therapistProfileId: profileId,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    if (existing) {
      // Update existing exception
      const updated = await db.availabilityException.update({
        where: { id: existing.id },
        data: {
          isAvailable: Boolean(isAvailable),
          startTime: isAvailable ? startTime || null : null,
          endTime: isAvailable ? endTime || null : null,
          reason: reason || null,
        },
      });

      return NextResponse.json({
        exception: {
          id: updated.id,
          date: updated.date.toISOString(),
          isAvailable: updated.isAvailable,
          startTime: updated.startTime,
          endTime: updated.endTime,
          reason: updated.reason,
        },
      });
    }

    // Create new exception
    const exception = await db.availabilityException.create({
      data: {
        therapistProfileId: profileId,
        date: exceptionDate,
        isAvailable: Boolean(isAvailable),
        startTime: isAvailable ? startTime || null : null,
        endTime: isAvailable ? endTime || null : null,
        reason: reason || null,
      },
    });

    return NextResponse.json(
      {
        exception: {
          id: exception.id,
          date: exception.date.toISOString(),
          isAvailable: exception.isAvailable,
          startTime: exception.startTime,
          endTime: exception.endTime,
          reason: exception.reason,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Create exception error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to create exception" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Exception ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const exception = await db.availabilityException.findUnique({
      where: { id },
      select: { therapistProfileId: true },
    });

    if (!exception) {
      return NextResponse.json(
        { error: "Exception not found" },
        { status: 404 }
      );
    }

    if (exception.therapistProfileId !== session.user.therapistProfileId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    await db.availabilityException.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete exception error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to delete exception" },
      { status: 500 }
    );
  }
}
