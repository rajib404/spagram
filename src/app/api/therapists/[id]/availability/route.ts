import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const dateParam = req.nextUrl.searchParams.get("date");

    // Get weekly availability (may have multiple blocks per day)
    const weekly = await db.availability.findMany({
      where: { therapistProfileId: id, isActive: true },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      select: {
        dayOfWeek: true,
        startTime: true,
        endTime: true,
      },
    });

    // If a specific date is requested, check exceptions and existing bookings
    if (dateParam) {
      const date = new Date(dateParam);
      const dayOfWeek = date.getDay();

      // Start/end of the requested date
      const dayStart = new Date(dateParam);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dateParam);
      dayEnd.setHours(23, 59, 59, 999);

      const [exception, bookings] = await Promise.all([
        db.availabilityException.findFirst({
          where: {
            therapistProfileId: id,
            date: { gte: dayStart, lte: dayEnd },
          },
        }),
        db.booking.findMany({
          where: {
            therapistProfileId: id,
            date: { gte: dayStart, lte: dayEnd },
            status: { in: ["PENDING", "ACCEPTED"] },
          },
          select: { startTime: true, endTime: true, duration: true },
        }),
      ]);

      // Gather all time blocks for this day
      const dayBlocks = weekly.filter((w) => w.dayOfWeek === dayOfWeek);
      let isAvailable = dayBlocks.length > 0;
      let timeBlocks = dayBlocks.map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
      }));

      // Apply exception overrides
      if (exception) {
        if (!exception.isAvailable) {
          isAvailable = false;
          timeBlocks = [];
        } else if (exception.startTime && exception.endTime) {
          isAvailable = true;
          timeBlocks = [
            { startTime: exception.startTime, endTime: exception.endTime },
          ];
        }
      }

      // Generate available time slots (30-min intervals) from all blocks
      const slots: string[] = [];
      if (isAvailable) {
        for (const block of timeBlocks) {
          const [sh, sm] = block.startTime.split(":").map(Number);
          const [eh, em] = block.endTime.split(":").map(Number);
          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;

          for (let m = startMin; m < endMin; m += 30) {
            const slotTime = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

            // Check if slot conflicts with existing bookings
            const isBooked = bookings.some((b) => {
              const [bsh, bsm] = b.startTime.split(":").map(Number);
              const [beh, bem] = b.endTime.split(":").map(Number);
              const bookStart = bsh * 60 + bsm;
              const bookEnd = beh * 60 + bem;
              return m >= bookStart && m < bookEnd;
            });

            if (!isBooked) {
              slots.push(slotTime);
            }
          }
        }
      }

      // For backward compatibility, provide startTime/endTime from first block
      const startTime = timeBlocks.length > 0 ? timeBlocks[0].startTime : null;
      const endTime =
        timeBlocks.length > 0
          ? timeBlocks[timeBlocks.length - 1].endTime
          : null;

      return NextResponse.json({
        weekly,
        date: dateParam,
        isAvailable,
        startTime,
        endTime,
        slots,
        bookedSlots: bookings.map((b) => ({
          startTime: b.startTime,
          endTime: b.endTime,
        })),
      });
    }

    return NextResponse.json({ weekly });
  } catch (error) {
    logger.error("Error fetching availability:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
