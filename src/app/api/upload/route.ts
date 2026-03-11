import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("file");

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const urls: string[] = [];

    for (const entry of files) {
      if (!(entry instanceof Blob)) {
        return NextResponse.json({ error: "Invalid file" }, { status: 400 });
      }

      if (!entry.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `Invalid file type: ${entry.type}. Only images are allowed.` },
          { status: 400 }
        );
      }

      if (entry.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File exceeds 4MB limit" },
          { status: 400 }
        );
      }

      const mime = entry.type.split("/")[1] || "jpg";
      const ext = mime === "jpeg" ? "jpg" : mime;
      const filename = `${randomUUID()}.${ext}`;
      const buffer = Buffer.from(await entry.arrayBuffer());

      await writeFile(join(UPLOAD_DIR, filename), buffer);
      urls.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
