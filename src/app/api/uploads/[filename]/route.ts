import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "uploads");

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;

  // Prevent path traversal
  if (filename.includes("/") || filename.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_TYPES[ext];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(join(UPLOAD_DIR, filename));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
