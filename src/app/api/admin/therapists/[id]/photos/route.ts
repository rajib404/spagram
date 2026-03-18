import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { id } = params;
    const body = await req.json();
    const { profilePhoto, galleryPhotos } = body as {
      profilePhoto?: string | null;
      galleryPhotos?: string[];
    };

    const data: Record<string, unknown> = {};
    if (profilePhoto !== undefined) data.profilePhoto = profilePhoto;
    if (galleryPhotos !== undefined) data.galleryPhotos = galleryPhotos;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await db.therapistProfile.update({
      where: { id },
      data,
      select: { id: true, profilePhoto: true, galleryPhotos: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admin photo update error:", error);
    return NextResponse.json(
      { error: "Failed to update photos" },
      { status: 500 }
    );
  }
}
