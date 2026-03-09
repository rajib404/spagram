"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Star,
  MapPin,
  BadgeCheck,
  Heart,
  Home,
  Navigation,
} from "lucide-react";
import { useFavorite } from "@/hooks/use-favorite";
import { cn } from "@/lib/utils";
import { OnlineStatus } from "@/components/shared/online-status";

interface TherapistCardProps {
  therapist: {
    id: string;
    slug: string;
    displayName: string;
    tagline: string | null;
    profilePhoto: string | null;
    gender: string | null;
    state: string | null;
    city: string | null;
    borough: string | null;
    massageTypes: string[];
    incallAvailable: boolean;
    outcallAvailable: boolean;
    incallPricePerHour: string | number | null;
    outcallPricePerHour: string | number | null;
    isVerified: boolean;
    rating: number;
    reviewCount: number;
    lastActiveAt?: string | null;
  };
  isFavorited?: boolean;
}

export function TherapistCard({ therapist: t, isFavorited = false }: TherapistCardProps) {
  const { favorited, loading: favLoading, toggle: toggleFavorite } = useFavorite(t.id, isFavorited);

  const startPrice = Math.min(
    ...[
      t.incallAvailable && t.incallPricePerHour
        ? Number(t.incallPricePerHour)
        : Infinity,
      t.outcallAvailable && t.outcallPricePerHour
        ? Number(t.outcallPricePerHour)
        : Infinity,
    ]
  );

  const displayTypes = t.massageTypes.slice(0, 3);
  const moreCount = t.massageTypes.length - 3;

  const location = [t.city, t.state].filter(Boolean).join(", ");

  return (
    <Link
      href={`/therapists/${t.slug}`}
      className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:border-neutral-300 hover:shadow-lg"
    >
      {/* Photo */}
      <div className="relative h-52 bg-gradient-to-br from-primary-100 to-primary-200 sm:h-56">
        {t.profilePhoto ? (
          <Image
            src={t.profilePhoto}
            alt={t.displayName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-5xl font-bold text-primary-300">
              {t.displayName.charAt(0)}
            </span>
          </div>
        )}

        {/* Top badges */}
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between">
          {t.isVerified ? (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-primary-700 backdrop-blur-sm">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified
            </span>
          ) : (
            <span />
          )}

          <button
            onClick={toggleFavorite}
            disabled={favLoading}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors",
              favorited
                ? "bg-error-50/90 text-error-500"
                : "bg-white/80 text-neutral-400 hover:text-error-500"
            )}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn("h-4 w-4", favorited && "fill-current")}
            />
          </button>
        </div>

        {/* Service type badges */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {t.incallAvailable && (
            <span className="flex items-center gap-1 rounded-full bg-neutral-900/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              <Home className="h-3 w-3" />
              Incall
            </span>
          )}
          {t.outcallAvailable && (
            <span className="flex items-center gap-1 rounded-full bg-neutral-900/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              <Navigation className="h-3 w-3" />
              Outcall
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-neutral-900 group-hover:text-primary-600">
                {t.displayName}
              </h3>
              <OnlineStatus lastActiveAt={t.lastActiveAt ?? null} />
            </div>
            {t.tagline && (
              <p className="mt-0.5 truncate text-xs text-neutral-500">
                {t.tagline}
              </p>
            )}
          </div>
          {startPrice < Infinity && (
            <div className="flex-shrink-0 text-right">
              <span className="text-sm font-semibold text-neutral-900">
                ${startPrice}
              </span>
              <span className="text-[10px] text-neutral-400">/hr</span>
            </div>
          )}
        </div>

        {/* Rating + Location */}
        <div className="mt-2.5 flex items-center gap-3 text-xs text-neutral-500">
          {t.reviewCount > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-neutral-700">
                {t.rating.toFixed(1)}
              </span>
              <span>({t.reviewCount})</span>
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </span>
          )}
        </div>

        {/* Massage types */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {displayTypes.map((type) => (
            <span
              key={type}
              className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600"
            >
              {type}
            </span>
          ))}
          {moreCount > 0 && (
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-medium text-primary-600">
              +{moreCount} more
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <span className="text-xs font-medium text-primary-600 group-hover:underline">
            View profile &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

export function TherapistCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="h-52 animate-pulse bg-neutral-200 sm:h-56" />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-36 animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-48 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="h-4 w-14 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="flex gap-3">
          <div className="h-3 w-16 animate-pulse rounded bg-neutral-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-neutral-100" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-neutral-100" />
        </div>
        <div className="border-t border-neutral-100 pt-3">
          <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}
