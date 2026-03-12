import { HeroSection } from "@/components/home/hero-section";
import { ValueProps } from "@/components/home/value-props";
import { FeaturedTherapists } from "@/components/home/featured-therapists";
import { HowItWorks } from "@/components/home/how-it-works";
import { CtaSection } from "@/components/home/cta-section";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getFeaturedTherapists() {
  try {
    const therapists = await db.therapistProfile.findMany({
      where: { isActive: true, profilePhoto: { not: null } },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: 6,
      select: {
        slug: true,
        displayName: true,
        tagline: true,
        profilePhoto: true,
        city: true,
        state: true,
        rating: true,
        reviewCount: true,
        isVerified: true,
        massageTypes: true,
        incallPricePerHour: true,
        outcallPricePerHour: true,
      },
    });

    return therapists.map((t) => ({
      ...t,
      incallPricePerHour: t.incallPricePerHour?.toNumber() ?? null,
      outcallPricePerHour: t.outcallPricePerHour?.toNumber() ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedTherapists();

  return (
    <>
      <HeroSection />
      <ValueProps />
      <FeaturedTherapists therapists={featured} />
      <HowItWorks />
      <CtaSection />
    </>
  );
}
