import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";

const PER_PAGE = 12;

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;

    // Pagination
    const page = Math.max(1, parseInt(params.get("page") || "1"));
    const skip = (page - 1) * PER_PAGE;

    // Build WHERE conditions
    const where: Prisma.TherapistProfileWhereInput = { isActive: true };

    // Location filters
    const state = params.get("state");
    const city = params.get("city");
    const borough = params.get("borough");
    if (state) where.state = state;
    if (city) where.city = city;
    if (borough) where.borough = borough;

    // Massage type filter (comma-separated, match any)
    const types = params.get("types");
    if (types) {
      where.massageTypes = { hasSome: types.split(",") };
    }

    // Service type filter
    const serviceType = params.get("serviceType");
    if (serviceType === "incall") where.incallAvailable = true;
    else if (serviceType === "outcall") where.outcallAvailable = true;

    // Gender filter
    const gender = params.get("gender");
    if (gender && gender !== "any") where.gender = gender;

    // Ethnicity filter (comma-separated)
    const ethnicity = params.get("ethnicity");
    if (ethnicity) {
      where.ethnicity = { in: ethnicity.split(",") };
    }

    // Age range
    const ageMin = params.get("ageMin");
    const ageMax = params.get("ageMax");
    if (ageMin || ageMax) {
      where.age = {};
      if (ageMin) where.age.gte = parseInt(ageMin);
      if (ageMax) where.age.lte = parseInt(ageMax);
    }

    // Price range (uses the lower of incall/outcall)
    const priceMin = params.get("priceMin");
    const priceMax = params.get("priceMax");
    if (priceMin || priceMax) {
      const priceConditions: Prisma.TherapistProfileWhereInput[] = [];
      const incallCondition: Prisma.TherapistProfileWhereInput = {
        incallAvailable: true,
        incallPricePerHour: {},
      };
      const outcallCondition: Prisma.TherapistProfileWhereInput = {
        outcallAvailable: true,
        outcallPricePerHour: {},
      };

      if (priceMin) {
        (incallCondition.incallPricePerHour as Prisma.DecimalNullableFilter).gte =
          parseFloat(priceMin);
        (outcallCondition.outcallPricePerHour as Prisma.DecimalNullableFilter).gte =
          parseFloat(priceMin);
      }
      if (priceMax) {
        (incallCondition.incallPricePerHour as Prisma.DecimalNullableFilter).lte =
          parseFloat(priceMax);
        (outcallCondition.outcallPricePerHour as Prisma.DecimalNullableFilter).lte =
          parseFloat(priceMax);
      }

      priceConditions.push(incallCondition, outcallCondition);
      where.OR = priceConditions;
    }

    // Rating filter
    const minRating = params.get("minRating");
    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }

    // Availability date filter
    const availDate = params.get("date");
    if (availDate) {
      const date = new Date(availDate);
      const dayOfWeek = date.getDay();
      where.availability = {
        some: {
          dayOfWeek,
          isActive: true,
        },
      };
    }

    // Sorting
    const sortBy = params.get("sort") || "rating";
    let orderBy: Prisma.TherapistProfileOrderByWithRelationInput;
    switch (sortBy) {
      case "price_asc":
        orderBy = { incallPricePerHour: { sort: "asc", nulls: "last" } };
        break;
      case "price_desc":
        orderBy = { incallPricePerHour: { sort: "desc", nulls: "last" } };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "reviews":
        orderBy = { reviewCount: "desc" };
        break;
      case "rating":
      default:
        orderBy = { rating: "desc" };
        break;
    }

    const [therapists, total] = await Promise.all([
      db.therapistProfile.findMany({
        where,
        orderBy,
        skip,
        take: PER_PAGE,
        select: {
          id: true,
          slug: true,
          displayName: true,
          tagline: true,
          profilePhoto: true,
          gender: true,
          ethnicity: true,
          age: true,
          state: true,
          city: true,
          borough: true,
          massageTypes: true,
          incallAvailable: true,
          outcallAvailable: true,
          incallPricePerHour: true,
          outcallPricePerHour: true,
          isVerified: true,
          rating: true,
          reviewCount: true,
          user: { select: { lastActiveAt: true } },
        },
      }),
      db.therapistProfile.count({ where }),
    ]);

    const serialized = therapists.map((t) => ({
      ...t,
      lastActiveAt: t.user?.lastActiveAt?.toISOString() ?? null,
      user: undefined,
    }));

    const response = NextResponse.json({
      therapists: serialized,
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
    });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
    return response;
  } catch (error) {
    logger.error("Error fetching therapists:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch therapists" },
      { status: 500 }
    );
  }
}
