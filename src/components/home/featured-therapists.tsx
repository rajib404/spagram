"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, MapPin, BadgeCheck } from "lucide-react";
import { ScrollAnimate } from "@/components/shared/scroll-animate";
// Static preview data — in production this would come from the DB
const FEATURED = [
  {
    slug: "elena-rodriguez",
    displayName: "Elena Rodriguez, LMT",
    tagline: "Expert deep tissue & sports massage",
    city: "New York",
    state: "NY",
    rating: 4.9,
    reviewCount: 47,
    price: 180,
    types: ["Deep Tissue", "Sports"],
    isVerified: true,
  },
  {
    slug: "david-kim",
    displayName: "David Kim, CMT",
    tagline: "Luxury hot stone & aromatherapy",
    city: "Brooklyn",
    state: "NY",
    rating: 4.8,
    reviewCount: 34,
    price: 200,
    types: ["Hot Stone", "Aromatherapy"],
    isVerified: true,
  },
  {
    slug: "natasha-volkov",
    displayName: "Natasha Volkov, RMT",
    tagline: "European luxury massage experience",
    city: "New York",
    state: "NY",
    rating: 4.9,
    reviewCount: 52,
    price: 220,
    types: ["Swedish", "Hot Stone"],
    isVerified: true,
  },
  {
    slug: "mei-tanaka",
    displayName: "Mei Tanaka, LMT",
    tagline: "Authentic Thai massage practitioner",
    city: "San Francisco",
    state: "CA",
    rating: 4.7,
    reviewCount: 29,
    price: 160,
    types: ["Thai", "Shiatsu"],
    isVerified: true,
  },
  {
    slug: "tyler-brooks",
    displayName: "Tyler Brooks, CSMT",
    tagline: "Pro athlete recovery specialist",
    city: "Atlanta",
    state: "GA",
    rating: 4.8,
    reviewCount: 41,
    price: 155,
    types: ["Sports", "Deep Tissue"],
    isVerified: true,
  },
  {
    slug: "priya-sharma",
    displayName: "Priya Sharma, LMT",
    tagline: "Hot stone & deep tissue wellness",
    city: "Boston",
    state: "MA",
    rating: 4.7,
    reviewCount: 23,
    price: 165,
    types: ["Hot Stone", "Deep Tissue"],
    isVerified: true,
  },
];

export function FeaturedTherapists() {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <section className="bg-neutral-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollAnimate>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                Top-rated therapists
              </h2>
              <p className="mt-3 text-lg text-neutral-500">
                Highly reviewed professionals ready to book
              </p>
            </div>
            <div className="hidden gap-2 sm:flex">
              <button
                onClick={() => scroll("left")}
                className="rounded-full border border-neutral-300 bg-white p-2 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="rounded-full border border-neutral-300 bg-white p-2 text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </ScrollAnimate>

        <div
          ref={scrollRef}
          className="mt-10 flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {FEATURED.map((t, i) => (
            <ScrollAnimate key={t.slug} delay={i * 100}>
              <Link
                href={`/therapists/${t.slug}`}
                className="group block w-[280px] flex-shrink-0 snap-start"
              >
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:border-neutral-300 hover:shadow-lg">
                  {/* Photo placeholder */}
                  <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary-400/50">
                        {t.displayName.charAt(0)}
                      </span>
                    </div>
                    {t.isVerified && (
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-primary-700 backdrop-blur-sm">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600">
                      {t.displayName}
                    </h3>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {t.tagline}
                    </p>

                    <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-neutral-900">
                          {t.rating}
                        </span>{" "}
                        ({t.reviewCount})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {t.city}, {t.state}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.types.map((type) => (
                        <span
                          key={type}
                          className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
                        >
                          {type}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                      <span className="text-sm font-semibold text-neutral-900">
                        ${t.price}
                        <span className="text-xs font-normal text-neutral-400">
                          /hr
                        </span>
                      </span>
                      <span className="text-xs font-medium text-primary-600 group-hover:underline">
                        View profile
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollAnimate>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/therapists"
            className="btn-secondary inline-flex items-center"
          >
            Browse all therapists
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
