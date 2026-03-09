import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { deleteAccountSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { password } = parsed.data;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user has a password, verify it
    if (user.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Password is required to delete account" },
          { status: 400 }
        );
      }
      const isValid = await compare(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Password is incorrect" },
          { status: 400 }
        );
      }
    }

    // Cancel any pending bookings
    await db.booking.updateMany({
      where: {
        clientId: session.user.id,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
      data: { status: "CANCELLED" },
    });

    // Delete the user (cascade will handle related records)
    await db.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete account error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
