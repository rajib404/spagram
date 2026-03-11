import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { ProfileHero } from "@/components/therapists/profile/profile-hero";
import { AboutSection } from "@/components/therapists/profile/about-section";
import { PricingSection } from "@/components/therapists/profile/pricing-section";
import { JsonLd } from "@/components/shared/json-ld";

const AvailabilityBooking = dynamic(
  () =>
    import("@/components/therapists/profile/availability-booking").then(
      (mod) => mod.AvailabilityBooking
    ),
  { ssr: false }
);

const ReviewsSection = dynamic(
  () =>
    import("@/components/therapists/profile/reviews-section").then(
      (mod) => mod.ReviewsSection
    ),
  { ssr: false }
);

interface PageProps {
  params: { slug: string };
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sparina.com";

async function getTherapist(slug: string) {
  const profile = await db.therapistProfile.findUnique({
    where: { slug },
    include: {
      user: {
        select: { firstName: true, lastName: true, image: true, lastActiveAt: true },
      },
    },
  });

  if (!profile || !profile.isActive) return null;
  return profile;
}

export const revalidate = 3600; // ISR: revalidate every hour

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const therapist = await getTherapist(params.slug);
  if (!therapist) {
    return { title: "Therapist Not Found" };
  }

  const location = [therapist.city, therapist.state].filter(Boolean).join(", ");
  const services = therapist.massageTypes.slice(0, 3).join(", ");
  const description =
    therapist.tagline ||
    `Book a massage with ${therapist.displayName}${location ? ` in ${location}` : ""}. ${services} and more.`;
  const url = `${APP_URL}/therapists/${params.slug}`;

  return {
    title: `${therapist.displayName}${location ? ` in ${location}` : ""} — Massage Therapist`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${therapist.displayName} — Massage Therapist${location ? ` in ${location}` : ""}`,
      description,
      url,
      type: "profile",
      ...(therapist.profilePhoto && {
        images: [{ url: therapist.profilePhoto, width: 600, height: 750, alt: therapist.displayName }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${therapist.displayName} — Massage Therapist`,
      description,
      ...(therapist.profilePhoto && { images: [therapist.profilePhoto] }),
    },
  };
}

export default async function TherapistProfilePage({ params }: PageProps) {
  const therapist = await getTherapist(params.slug);
  if (!therapist) notFound();

  const location = [therapist.city, therapist.state].filter(Boolean).join(", ");
  const priceRange = [
    therapist.incallPricePerHour ? Number(therapist.incallPricePerHour) : null,
    therapist.outcallPricePerHour ? Number(therapist.outcallPricePerHour) : null,
  ].filter((p): p is number => p !== null);
  const minPrice = priceRange.length > 0 ? Math.min(...priceRange) : undefined;
  const maxPrice = priceRange.length > 0 ? Math.max(...priceRange) : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: therapist.displayName,
    description: therapist.tagline || therapist.bio || `Massage therapist${location ? ` in ${location}` : ""}`,
    url: `${APP_URL}/therapists/${params.slug}`,
    ...(therapist.profilePhoto && { image: therapist.profilePhoto }),
    ...(location && {
      address: {
        "@type": "PostalAddress",
        addressLocality: therapist.city,
        addressRegion: therapist.state,
        addressCountry: "US",
      },
    }),
    ...(therapist.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: therapist.rating.toFixed(1),
        reviewCount: therapist.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(minPrice !== undefined && {
      priceRange: minPrice === maxPrice ? `$${minPrice}/hr` : `$${minPrice}–$${maxPrice}/hr`,
    }),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={jsonLd} />
      <div className="grid gap-8 lg:grid-cols-[400px_1fr] lg:gap-12">
        {/* Left column — Photo + Booking */}
        <div className="space-y-8">
          <ProfileHero
            id={therapist.id}
            displayName={therapist.displayName}
            tagline={therapist.tagline}
            profilePhoto={therapist.profilePhoto}
            galleryPhotos={therapist.galleryPhotos}
            city={therapist.city}
            state={therapist.state}
            borough={therapist.borough}
            isVerified={therapist.isVerified}
            rating={therapist.rating}
            reviewCount={therapist.reviewCount}
            incallAvailable={therapist.incallAvailable}
            outcallAvailable={therapist.outcallAvailable}
            lastActiveAt={therapist.user.lastActiveAt?.toISOString() ?? null}
          />

          <PricingSection
            incallAvailable={therapist.incallAvailable}
            outcallAvailable={therapist.outcallAvailable}
            incallPricePerHour={therapist.incallPricePerHour?.toString() ?? null}
            outcallPricePerHour={therapist.outcallPricePerHour?.toString() ?? null}
          />
        </div>

        {/* Right column — About, Availability, Reviews */}
        <div className="space-y-10">
          <AboutSection
            bio={therapist.bio}
            age={therapist.age}
            height={therapist.height}
            weight={therapist.weight}
            ethnicity={therapist.ethnicity}
            hairColor={therapist.hairColor}
            eyeColor={therapist.eyeColor}
            gender={therapist.gender}
            massageTypes={therapist.massageTypes}
          />

          <AvailabilityBooking
            therapistProfileId={therapist.id}
            massageTypes={therapist.massageTypes}
            incallAvailable={therapist.incallAvailable}
            outcallAvailable={therapist.outcallAvailable}
            incallPricePerHour={
              therapist.incallPricePerHour
                ? Number(therapist.incallPricePerHour)
                : null
            }
            outcallPricePerHour={
              therapist.outcallPricePerHour
                ? Number(therapist.outcallPricePerHour)
                : null
            }
          />

          <ReviewsSection
            therapistProfileId={therapist.id}
            rating={therapist.rating}
            reviewCount={therapist.reviewCount}
          />
        </div>
      </div>
    </div>
  );
}
