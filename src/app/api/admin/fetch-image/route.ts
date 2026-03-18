import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for remote fetches
const UPLOAD_DIR = join(process.cwd(), "uploads");

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const { urls } = (await req.json()) as { urls: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    if (urls.length > 10) {
      return NextResponse.json({ error: "Max 10 URLs at a time" }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const results: string[] = [];
    const errors: string[] = [];

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Sparina-ImageFetcher/1.0" },
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
          errors.push(`${url}: HTTP ${res.status}`);
          continue;
        }

        const contentType = res.headers.get("content-type") || "";
        const mimeBase = contentType.split(";")[0].trim().toLowerCase();

        if (!mimeBase.startsWith("image/")) {
          errors.push(`${url}: Not an image (${mimeBase})`);
          continue;
        }

        const buffer = Buffer.from(await res.arrayBuffer());

        if (buffer.length > MAX_FILE_SIZE) {
          errors.push(`${url}: Exceeds 10MB`);
          continue;
        }

        const ext = EXT_MAP[mimeBase] || mimeBase.split("/")[1] || "jpg";
        const filename = `${randomUUID()}.${ext}`;
        await writeFile(join(UPLOAD_DIR, filename), buffer);
        results.push(`/api/uploads/${filename}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${url}: ${msg}`);
      }
    }

    return NextResponse.json({ urls: results, errors });
  } catch (error) {
    console.error("Fetch image error:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
