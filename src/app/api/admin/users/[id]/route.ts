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
    const { role, isActive } = body;

    // Prevent admin from modifying their own role
    if (role && params.id === auth.session.user.id) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (role && ["CLIENT", "THERAPIST", "ADMIN"].includes(role)) {
      updateData.role = role;
    }

    // Activate/deactivate: for therapists, toggle their profile's isActive
    if (typeof isActive === "boolean") {
      const user = await db.user.findUnique({
        where: { id: params.id },
        select: { therapistProfile: { select: { id: true } } },
      });

      if (user?.therapistProfile) {
        await db.therapistProfile.update({
          where: { id: user.therapistProfile.id },
          data: { isActive },
        });
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db.user.update({
        where: { id: params.id },
        data: updateData,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Error updating user:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
