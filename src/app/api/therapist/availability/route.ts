import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const availability = await db.availability.findMany({
      where: { therapistProfileId: session.user.therapistProfileId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ availability });
  } catch (error) {
    logger.error("Get availability error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}

interface TimeBlock {
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  dayOfWeek: number;
  isActive: boolean;
  blocks: TimeBlock[];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function validateBlocks(blocks: TimeBlock[]): string | null {
  for (const block of blocks) {
    if (!block.startTime || !block.endTime) {
      return "Start and end times are required";
    }
    if (!/^\d{2}:\d{2}$/.test(block.startTime) || !/^\d{2}:\d{2}$/.test(block.endTime)) {
      return "Invalid time format";
    }
    if (timeToMinutes(block.endTime) <= timeToMinutes(block.startTime)) {
      return "End time must be after start time";
    }
  }

  // Check for overlaps
  const sorted = [...blocks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
  for (let i = 1; i < sorted.length; i++) {
    if (timeToMinutes(sorted[i].startTime) < timeToMinutes(sorted[i - 1].endTime)) {
      return "Time blocks cannot overlap";
    }
  }

  return null;
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.therapistProfileId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileId = session.user.therapistProfileId;
    const body = await req.json();
    const { schedule } = body as { schedule: DaySchedule[] };

    if (!Array.isArray(schedule)) {
      return NextResponse.json(
        { error: "Invalid schedule data" },
        { status: 400 }
      );
    }

    // Validate all days
    for (const day of schedule) {
      if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
        return NextResponse.json(
          { error: "Invalid day of week" },
          { status: 400 }
        );
      }

      if (day.isActive && day.blocks.length > 0) {
        const error = validateBlocks(day.blocks);
        if (error) {
          const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          return NextResponse.json(
            { error: `${dayNames[day.dayOfWeek]}: ${error}` },
            { status: 400 }
          );
        }
      }
    }

    // Replace all availability records in a transaction
    await db.$transaction(async (tx) => {
      // Delete existing
      await tx.availability.deleteMany({
        where: { therapistProfileId: profileId },
      });

      // Create new blocks
      const records: {
        therapistProfileId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isActive: boolean;
      }[] = [];

      for (const day of schedule) {
        if (day.isActive && day.blocks.length > 0) {
          for (const block of day.blocks) {
            records.push({
              therapistProfileId: profileId,
              dayOfWeek: day.dayOfWeek,
              startTime: block.startTime,
              endTime: block.endTime,
              isActive: true,
            });
          }
        }
      }

      if (records.length > 0) {
        await tx.availability.createMany({ data: records });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Update availability error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 }
    );
  }
}
