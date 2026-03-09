"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";


interface FavoriteTherapist {
  id: string;
  displayName: string;
  slug: string;
  profilePhoto: string | null;
  tagline: string | null;
  city: string | null;
  state: string | null;
  rating: number;
  reviewCount: number;
  massageTypes: string[];
  incallAvailable: boolean;
  outcallAvailable: boolean;
  incallPricePerHour: string | null;
  outcallPricePerHour: string | null;
  isVerified: boolean;
}

interface Favorite {
  id: string;
  therapistProfileId: string;
  createdAt: string;
  therapist: FavoriteTherapist;
}

function formatServiceType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function FavoritesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user-favorites"],
    queryFn: async () => {
      const res = await fetch("/api/user/favorites");
      if (!res.ok) throw new Error("Failed to fetch favorites");
      return res.json() as Promise<{ favorites: Favorite[] }>;
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (therapistProfileId: string) => {
      const res = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapistProfileId }),
      });
      if (!res.ok) throw new Error("Failed to remove favorite");
      return res.json();
    },
    onMutate: async (therapistProfileId) => {
      await queryClient.cancelQueries({ queryKey: ["user-favorites"] });
      const previous = queryClient.getQueryData<{ favorites: Favorite[] }>(["user-favorites"]);
      queryClient.setQueryData<{ favorites: Favorite[] }>(["user-favorites"], (old) => {
        if (!old) return old;
        return {
          favorites: old.favorites.filter((f) => f.therapistProfileId !== therapistProfileId),
        };
      });
      return { previous };
    },
    onSuccess: () => {
      toast.success("Removed from favorites");
    },
    onError: (_err, _id, context) => {
      toast.error("Failed to remove favorite");
      if (context?.previous) {
        queryClient.setQueryData(["user-favorites"], context.previous);
      }
    },
  });

  const favorites = data?.favorites || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Favorites</h1>
        <p className="text-neutral-500 mt-1">
          Your saved therapists for easy booking.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 overflow-hidden animate-pulse">
              <div className="h-48 bg-neutral-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-neutral-200 rounded w-32" />
                <div className="h-3 bg-neutral-100 rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-neutral-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <h3 className="text-lg font-semibold text-neutral-700 mb-1">
            No favorites yet
          </h3>
          <p className="text-neutral-500 mb-4">
            Save therapists you like for quick access later.
          </p>
          <Link
            href="/therapists"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Browse Therapists
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => {
            const t = fav.therapist;
            const lowestPrice = Math.min(
              ...[
                t.incallPricePerHour ? parseFloat(t.incallPricePerHour) : Infinity,
                t.outcallPricePerHour ? parseFloat(t.outcallPricePerHour) : Infinity,
              ]
            );

            return (
              <div
                key={fav.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden group hover:border-primary-300 transition-colors"
              >
                {/* Photo */}
                <Link href={`/therapists/${t.slug}`} className="block relative">
                  {t.profilePhoto ? (
                    <Image
                      src={t.profilePhoto}
                      alt={t.displayName}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary-300">
                        {t.displayName.charAt(0)}
                      </span>
                    </div>
                  )}
                  {t.isVerified && (
                    <span className="absolute top-3 left-3 bg-white/90 text-xs font-medium text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/therapists/${t.slug}`}
                        className="font-semibold text-neutral-900 hover:text-primary-600 transition-colors truncate block"
                      >
                        {t.displayName}
                      </Link>
                      {t.tagline && (
                        <p className="text-sm text-neutral-500 truncate mt-0.5">
                          {t.tagline}
                        </p>
                      )}
                    </div>
                    {/* Remove favorite button */}
                    <button
                      onClick={() => removeMutation.mutate(fav.therapistProfileId)}
                      disabled={removeMutation.isPending}
                      className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                      title="Remove from favorites"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                    </button>
                  </div>

                  {/* Location */}
                  {t.city && (
                    <p className="text-xs text-neutral-400 mt-1">
                      {t.city}{t.state ? `, ${t.state}` : ""}
                    </p>
                  )}

                  {/* Rating + Price */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      {t.reviewCount > 0 ? (
                        <>
                          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm font-medium text-neutral-700">
                            {t.rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-neutral-400">
                            ({t.reviewCount})
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-neutral-400">No reviews</span>
                      )}
                    </div>
                    {lowestPrice !== Infinity && (
                      <p className="text-sm font-semibold text-neutral-900">
                        From ${lowestPrice.toFixed(0)}/hr
                      </p>
                    )}
                  </div>

                  {/* Services */}
                  {t.massageTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {t.massageTypes.slice(0, 3).map((type) => (
                        <span
                          key={type}
                          className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded"
                        >
                          {formatServiceType(type)}
                        </span>
                      ))}
                      {t.massageTypes.length > 3 && (
                        <span className="text-xs text-neutral-400">
                          +{t.massageTypes.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Location type badges */}
                  <div className="flex gap-2 mt-3">
                    {t.incallAvailable && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                        Incall
                      </span>
                    )}
                    {t.outcallAvailable && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        Outcall
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
