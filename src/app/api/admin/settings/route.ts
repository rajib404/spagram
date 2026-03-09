import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    let settings = await db.platformSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await db.platformSettings.create({
        data: { id: "singleton" },
      });
    }

    return NextResponse.json({
      bookingFeePercent: settings.bookingFeePercent,
      supportedMassageTypes: settings.supportedMassageTypes,
      supportedStates: settings.supportedStates,
      updatedAt: settings.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error("Error fetching settings:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { bookingFeePercent, supportedMassageTypes, supportedStates } = body;

    const updateData: Record<string, unknown> = {};

    if (typeof bookingFeePercent === "number" && bookingFeePercent >= 0 && bookingFeePercent <= 100) {
      updateData.bookingFeePercent = bookingFeePercent;
    }

    if (Array.isArray(supportedMassageTypes) && supportedMassageTypes.every((t: unknown) => typeof t === "string")) {
      updateData.supportedMassageTypes = supportedMassageTypes;
    }

    if (Array.isArray(supportedStates) && supportedStates.every((s: unknown) => typeof s === "string")) {
      updateData.supportedStates = supportedStates;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const settings = await db.platformSettings.upsert({
      where: { id: "singleton" },
      update: updateData,
      create: { id: "singleton", ...updateData },
    });

    return NextResponse.json({
      bookingFeePercent: settings.bookingFeePercent,
      supportedMassageTypes: settings.supportedMassageTypes,
      supportedStates: settings.supportedStates,
      updatedAt: settings.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error("Error updating settings:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
