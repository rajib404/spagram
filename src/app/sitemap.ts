import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://spagram.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let therapists: { slug: string; updatedAt: Date }[] = [];
  try {
    therapists = await db.therapistProfile.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
  } catch {
    // DB may not be available during build
  }

  const therapistUrls: MetadataRoute.Sitemap = therapists.map((t) => ({
    url: `${APP_URL}/therapists/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${APP_URL}/therapists`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/login`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/register`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...therapistUrls,
  ];
}
