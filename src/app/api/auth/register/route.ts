import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimit(`register:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { firstName, lastName, email, password, role } = parsed.data;

    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role as Role,
      },
    });

    // If therapist, create an empty profile with auto-generated slug
    let therapistProfileId: string | null = null;

    if (role === "THERAPIST") {
      const baseSlug = `${firstName}-${lastName}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Ensure slug uniqueness
      let slug = baseSlug;
      let counter = 1;
      while (await db.therapistProfile.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const profile = await db.therapistProfile.create({
        data: {
          userId: user.id,
          displayName: `${firstName} ${lastName}`,
          slug,
        },
      });
      therapistProfileId = profile.id;
    }

    // Send verification email (non-blocking)
    const verificationToken = randomUUID();
    await db.verificationToken.create({
      data: {
        identifier: `verify:${email.toLowerCase()}`,
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
    sendVerificationEmail(email.toLowerCase(), firstName, verificationToken).catch(
      (err) => logger.error("Failed to send verification email:", { error: err instanceof Error ? err.message : String(err) })
    );

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        therapistProfileId,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Registration error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
