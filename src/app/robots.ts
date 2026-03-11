import { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sparina.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/user/", "/therapist/", "/login", "/register"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
