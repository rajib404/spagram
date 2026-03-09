import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { isVerified, isActive } = body;

    const updateData: Record<string, unknown> = {};

    if (typeof isVerified === "boolean") updateData.isVerified = isVerified;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await db.therapistProfile.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Error updating therapist:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to update therapist" }, { status: 500 });
  }
}
