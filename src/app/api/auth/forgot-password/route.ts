import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`forgot-password:${ip}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user && user.password) {
      // Delete existing reset tokens for this user
      await db.verificationToken.deleteMany({
        where: { identifier: `reset:${email.toLowerCase()}` },
      });

      const token = randomUUID();
      await db.verificationToken.create({
        data: {
          identifier: `reset:${email.toLowerCase()}`,
          token,
          expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      sendPasswordResetEmail(
        email.toLowerCase(),
        user.firstName || "there",
        token
      ).catch((err) =>
        logger.error("Failed to send password reset email:", {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    }

    return NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    logger.error("Forgot password error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
