import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

function withCache(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );
  return res;
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const state = params.get("state");
    const city = params.get("city");

    // Get distinct states
    if (!state) {
      const states = await db.therapistProfile.findMany({
        where: { isActive: true, state: { not: null } },
        select: { state: true },
        distinct: ["state"],
        orderBy: { state: "asc" },
      });
      return withCache(NextResponse.json({
        states: states.map((s) => s.state).filter(Boolean),
      }));
    }

    // Get cities for a state
    if (state && !city) {
      const cities = await db.therapistProfile.findMany({
        where: { isActive: true, state },
        select: { city: true },
        distinct: ["city"],
        orderBy: { city: "asc" },
      });
      return withCache(NextResponse.json({
        cities: cities.map((c) => c.city).filter(Boolean),
      }));
    }

    // Get boroughs for a city
    if (state && city) {
      const boroughs = await db.therapistProfile.findMany({
        where: { isActive: true, state, city, borough: { not: null } },
        select: { borough: true },
        distinct: ["borough"],
        orderBy: { borough: "asc" },
      });
      return withCache(NextResponse.json({
        boroughs: boroughs.map((b) => b.borough).filter(Boolean),
      }));
    }

    return NextResponse.json({ states: [], cities: [], boroughs: [] });
  } catch (error) {
    logger.error("Error fetching locations:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
