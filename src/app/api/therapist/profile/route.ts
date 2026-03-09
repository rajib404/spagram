import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        therapistProfile: true,
      },
    });

    if (!user?.therapistProfile) {
      return NextResponse.json(
        { error: "Therapist profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: { email: user.email, phone: user.phone },
      profile: {
        ...user.therapistProfile,
        incallPricePerHour: user.therapistProfile.incallPricePerHour?.toString() ?? null,
        outcallPricePerHour: user.therapistProfile.outcallPricePerHour?.toString() ?? null,
      },
    });
  } catch (error) {
    logger.error("Get profile error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { therapistProfile: { select: { id: true } } },
    });

    if (!user?.therapistProfile) {
      return NextResponse.json(
        { error: "Therapist profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { section, data } = body;

    const profileId = user.therapistProfile.id;

    switch (section) {
      case "basic": {
        const { displayName, tagline, bio, slug } = data;

        if (!displayName?.trim()) {
          return NextResponse.json(
            { error: "Display name is required" },
            { status: 400 }
          );
        }

        if (slug) {
          const slugRegex = /^[a-z0-9-]+$/;
          if (!slugRegex.test(slug)) {
            return NextResponse.json(
              { error: "Slug can only contain lowercase letters, numbers, and hyphens" },
              { status: 400 }
            );
          }

          const existing = await db.therapistProfile.findFirst({
            where: { slug, id: { not: profileId } },
            select: { id: true },
          });

          if (existing) {
            return NextResponse.json(
              { error: "This URL slug is already taken" },
              { status: 409 }
            );
          }
        }

        await db.therapistProfile.update({
          where: { id: profileId },
          data: {
            displayName: displayName.trim(),
            tagline: tagline?.trim() || null,
            bio: bio?.trim() || null,
            ...(slug && { slug }),
          },
        });
        break;
      }

      case "personal": {
        const { gender, ethnicity, age, height, weight, hairColor, eyeColor } = data;
        await db.therapistProfile.update({
          where: { id: profileId },
          data: {
            gender: gender || null,
            ethnicity: ethnicity || null,
            age: age ? parseInt(age, 10) : null,
            height: height || null,
            weight: weight || null,
            hairColor: hairColor || null,
            eyeColor: eyeColor || null,
          },
        });
        break;
      }

      case "photos": {
        const { profilePhoto, galleryPhotos } = data;
        await db.therapistProfile.update({
          where: { id: profileId },
          data: {
            profilePhoto: profilePhoto || null,
            galleryPhotos: galleryPhotos || [],
          },
        });
        break;
      }

      case "location": {
        const {
          state, city, borough, fullAddress,
          incallAvailable, outcallAvailable,
          incallAddress, outcallRadius,
        } = data;

        await db.therapistProfile.update({
          where: { id: profileId },
          data: {
            state: state || null,
            city: city || null,
            borough: borough || null,
            fullAddress: fullAddress || null,
            incallAvailable: Boolean(incallAvailable),
            outcallAvailable: Boolean(outcallAvailable),
            incallAddress: incallAddress || null,
            outcallRadius: outcallRadius ? parseInt(outcallRadius, 10) : null,
          },
        });
        break;
      }

      case "services": {
        const { massageTypes, incallPricePerHour, outcallPricePerHour } = data;
        await db.therapistProfile.update({
          where: { id: profileId },
          data: {
            massageTypes: massageTypes || [],
            incallPricePerHour: incallPricePerHour ? parseFloat(incallPricePerHour) : null,
            outcallPricePerHour: outcallPricePerHour ? parseFloat(outcallPricePerHour) : null,
          },
        });
        break;
      }

      case "account": {
        const { email, phone, currentPassword, newPassword } = data;

        const updateUserData: Record<string, unknown> = {};

        if (email && email !== session.user.email) {
          const existingEmail = await db.user.findUnique({
            where: { email },
            select: { id: true },
          });
          if (existingEmail) {
            return NextResponse.json(
              { error: "Email already in use" },
              { status: 409 }
            );
          }
          updateUserData.email = email;
        }

        if (phone !== undefined) {
          updateUserData.phone = phone || null;
        }

        if (newPassword) {
          if (!currentPassword) {
            return NextResponse.json(
              { error: "Current password is required" },
              { status: 400 }
            );
          }

          const userWithPassword = await db.user.findUnique({
            where: { id: session.user.id },
            select: { password: true },
          });

          if (!userWithPassword?.password) {
            return NextResponse.json(
              { error: "Cannot change password for OAuth accounts" },
              { status: 400 }
            );
          }

          const isValid = await bcrypt.compare(
            currentPassword,
            userWithPassword.password
          );

          if (!isValid) {
            return NextResponse.json(
              { error: "Current password is incorrect" },
              { status: 400 }
            );
          }

          if (newPassword.length < 8) {
            return NextResponse.json(
              { error: "New password must be at least 8 characters" },
              { status: 400 }
            );
          }

          updateUserData.password = await bcrypt.hash(newPassword, 12);
        }

        if (Object.keys(updateUserData).length > 0) {
          await db.user.update({
            where: { id: session.user.id },
            data: updateUserData,
          });
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid section" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Update profile error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
