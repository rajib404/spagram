import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { favoriteSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!rateLimit(`fav:${session.user.id}`, 30, 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = favoriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { therapistProfileId } = parsed.data;

    const favorite = await db.favorite.create({
      data: {
        userId: session.user.id,
        therapistProfileId,
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error: unknown) {
    // Handle duplicate
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "Already favorited" },
        { status: 409 }
      );
    }
    logger.error("Error creating favorite", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = favoriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { therapistProfileId } = parsed.data;

    await db.favorite.deleteMany({
      where: {
        userId: session.user.id,
        therapistProfileId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error removing favorite", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
