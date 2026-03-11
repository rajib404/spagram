"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, MapPin, BadgeCheck } from "lucide-react";
import { ScrollAnimate } from "@/components/shared/scroll-animate";

interface FeaturedTherapist {
  slug: string;
  displayName: string;
  tagline: string | null;
  profilePhoto: string | null;
  city: string | null;
  state: string | null;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  massageTypes: string[];
  incallPricePerHour: number | null;
  outcallPricePerHour: number | null;
}

interface Props {
  therapists: FeaturedTherapist[];
}

export function FeaturedTherapists({ therapists }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  if (therapists.length === 0) return null;

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
          {therapists.map((t, i) => {
            const price = Math.min(
              ...[
                t.incallPricePerHour ?? Infinity,
                t.outcallPricePerHour ?? Infinity,
              ]
            );
            const displayTypes = t.massageTypes.slice(0, 3);

            return (
              <ScrollAnimate key={t.slug} delay={i * 100}>
                <Link
                  href={`/therapists/${t.slug}`}
                  className="group block w-[280px] flex-shrink-0 snap-start"
                >
                  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:border-neutral-300 hover:shadow-lg">
                    {/* Photo */}
                    <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
                      {t.profilePhoto ? (
                        <Image
                          src={t.profilePhoto}
                          alt={t.displayName}
                          fill
                          className="object-cover"
                          sizes="280px"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl font-bold text-primary-400/50">
                            {t.displayName.charAt(0)}
                          </span>
                        </div>
                      )}
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
                      {t.tagline && (
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {t.tagline}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                        {t.reviewCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium text-neutral-900">
                              {t.rating.toFixed(1)}
                            </span>{" "}
                            ({t.reviewCount})
                          </span>
                        )}
                        {(t.city || t.state) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {[t.city, t.state].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {displayTypes.map((type) => (
                          <span
                            key={type}
                            className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
                          >
                            {type}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                        {price < Infinity ? (
                          <span className="text-sm font-semibold text-neutral-900">
                            ${price}
                            <span className="text-xs font-normal text-neutral-400">
                              /hr
                            </span>
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="text-xs font-medium text-primary-600 group-hover:underline">
                          View profile
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollAnimate>
            );
          })}
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
