"use client";

import {
  MapPin,
  BadgeCheck,
  Star,
  Heart,
  Home,
  Navigation,
} from "lucide-react";
import { useFavorite } from "@/hooks/use-favorite";
import { cn } from "@/lib/utils";
import { PhotoGallery } from "./photo-gallery";
import { OnlineStatus } from "@/components/shared/online-status";

interface ProfileHeroProps {
  id: string;
  displayName: string;
  tagline: string | null;
  profilePhoto: string | null;
  galleryPhotos: string[];
  city: string | null;
  state: string | null;
  borough: string | null;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  incallAvailable: boolean;
  outcallAvailable: boolean;
  lastActiveAt?: string | null;
  isFavorited?: boolean;
}

export function ProfileHero({
  id,
  displayName,
  tagline,
  profilePhoto,
  galleryPhotos,
  city,
  state,
  borough,
  isVerified,
  rating,
  reviewCount,
  incallAvailable,
  outcallAvailable,
  lastActiveAt,
  isFavorited = false,
}: ProfileHeroProps) {
  const { favorited, loading: favLoading, toggle: toggleFavorite } = useFavorite(id, isFavorited);

  const location = [borough, city, state].filter(Boolean).join(", ");

  return (
    <div>
      {/* Photo gallery */}
      <PhotoGallery
        profilePhoto={profilePhoto}
        galleryPhotos={galleryPhotos}
        displayName={displayName}
      />

      {/* Info below photo */}
      <div className="mt-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
                {displayName}
              </h1>
              {isVerified && (
                <BadgeCheck className="h-5 w-5 flex-shrink-0 text-primary-500" />
              )}
            </div>
            {tagline && (
              <p className="mt-0.5 text-sm text-neutral-500">{tagline}</p>
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={toggleFavorite}
            disabled={favLoading}
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
              favorited
                ? "border-error-200 bg-error-50 text-error-500"
                : "border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-error-500"
            )}
            aria-label={
              favorited ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart
              className={cn("h-5 w-5", favorited && "fill-current")}
            />
          </button>
        </div>

        {/* Location + Online Status */}
        <div className="mt-2 flex items-center gap-3">
          {location && (
            <span className="flex items-center gap-1.5 text-sm text-neutral-500">
              <MapPin className="h-4 w-4" />
              {location}
            </span>
          )}
          <OnlineStatus lastActiveAt={lastActiveAt ?? null} size="md" />
        </div>

        {/* Rating + Review link */}
        <div className="mt-3 flex items-center gap-3">
          {reviewCount > 0 ? (
            <a
              href="#reviews"
              className="flex items-center gap-1.5 text-sm transition-colors hover:text-primary-600"
            >
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "h-4 w-4",
                      rating >= s
                        ? "fill-amber-400 text-amber-400"
                        : rating >= s - 0.5
                          ? "fill-amber-400/50 text-amber-400"
                          : "fill-neutral-200 text-neutral-200"
                    )}
                  />
                ))}
              </div>
              <span className="font-medium text-neutral-700">
                {rating.toFixed(1)}
              </span>
              <span className="text-neutral-400">
                ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
              </span>
            </a>
          ) : (
            <span className="text-sm text-neutral-400">No reviews yet</span>
          )}
        </div>

        {/* Service badges */}
        <div className="mt-3 flex gap-2">
          {incallAvailable && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
              <Home className="h-3.5 w-3.5" />
              Incall available
            </span>
          )}
          {outcallAvailable && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700">
              <Navigation className="h-3.5 w-3.5" />
              Outcall available
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
