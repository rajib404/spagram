"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import {
  FilterSidebar,
  ActiveFilterTags,
  DEFAULT_FILTERS,
  type Filters,
} from "@/components/therapists/filter-sidebar";
import {
  TherapistCard,
  TherapistCardSkeleton,
} from "@/components/therapists/therapist-card";
import { Pagination } from "@/components/therapists/pagination";

interface TherapistResult {
  id: string;
  slug: string;
  displayName: string;
  tagline: string | null;
  profilePhoto: string | null;
  gender: string | null;
  ethnicity: string | null;
  age: number | null;
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
  lastActiveAt: string | null;
}

function parseFiltersFromParams(params: URLSearchParams): Filters {
  return {
    state: params.get("state") || "",
    city: params.get("city") || "",
    borough: params.get("borough") || "",
    types: params.get("types")?.split(",").filter(Boolean) || [],
    serviceType: params.get("serviceType") || "",
    gender: params.get("gender") || "",
    ethnicity: params.get("ethnicity")?.split(",").filter(Boolean) || [],
    ageRange: [
      parseInt(params.get("ageMin") || "18"),
      parseInt(params.get("ageMax") || "65"),
    ],
    priceRange: [
      parseInt(params.get("priceMin") || "0"),
      parseInt(params.get("priceMax") || "500"),
    ],
    minRating: parseFloat(params.get("minRating") || "0"),
    date: params.get("date") || "",
    sort: params.get("sort") || "rating",
    page: parseInt(params.get("page") || "1"),
  };
}

function filtersToParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.state) params.set("state", filters.state);
  if (filters.city) params.set("city", filters.city);
  if (filters.borough) params.set("borough", filters.borough);
  if (filters.types.length > 0) params.set("types", filters.types.join(","));
  if (filters.serviceType) params.set("serviceType", filters.serviceType);
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.ethnicity.length > 0)
    params.set("ethnicity", filters.ethnicity.join(","));
  if (filters.ageRange[0] !== 18) params.set("ageMin", String(filters.ageRange[0]));
  if (filters.ageRange[1] !== 65) params.set("ageMax", String(filters.ageRange[1]));
  if (filters.priceRange[0] !== 0)
    params.set("priceMin", String(filters.priceRange[0]));
  if (filters.priceRange[1] !== 500)
    params.set("priceMax", String(filters.priceRange[1]));
  if (filters.minRating > 0)
    params.set("minRating", String(filters.minRating));
  if (filters.date) params.set("date", filters.date);
  if (filters.sort !== "rating") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}

function filtersToApiParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.state) params.set("state", filters.state);
  if (filters.city) params.set("city", filters.city);
  if (filters.borough) params.set("borough", filters.borough);
  if (filters.types.length > 0) params.set("types", filters.types.join(","));
  if (filters.serviceType) params.set("serviceType", filters.serviceType);
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.ethnicity.length > 0)
    params.set("ethnicity", filters.ethnicity.join(","));
  if (filters.ageRange[0] !== 18) params.set("ageMin", String(filters.ageRange[0]));
  if (filters.ageRange[1] !== 65) params.set("ageMax", String(filters.ageRange[1]));
  if (filters.priceRange[0] !== 0)
    params.set("priceMin", String(filters.priceRange[0]));
  if (filters.priceRange[1] !== 500)
    params.set("priceMax", String(filters.priceRange[1]));
  if (filters.minRating > 0)
    params.set("minRating", String(filters.minRating));
  if (filters.date) params.set("date", filters.date);
  params.set("sort", filters.sort);
  params.set("page", String(filters.page));

  return params;
}

function TherapistsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() =>
    parseFiltersFromParams(searchParams)
  );
  const [therapists, setTherapists] = useState<TherapistResult[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch therapists
  const fetchTherapists = useCallback(async (f: Filters) => {
    setIsLoading(true);
    try {
      const apiParams = filtersToApiParams(f);
      const res = await fetch(`/api/therapists?${apiParams.toString()}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      setTherapists(data.therapists);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setTherapists([]);
      setTotal(0);
      setTotalPages(0);
    }
    setIsLoading(false);
  }, []);

  // Sync URL params → fetch
  useEffect(() => {
    fetchTherapists(filters);
    // Update URL without navigation
    const urlParams = filtersToParams(filters);
    const queryString = urlParams.toString();
    const newUrl = queryString
      ? `/therapists?${queryString}`
      : "/therapists";
    router.replace(newUrl, { scroll: false });
  }, [filters, fetchTherapists, router]);

  function handleFilterChange(newFilters: Filters) {
    setFilters(newFilters);
  }

  function handleClearFilters() {
    setFilters({ ...DEFAULT_FILTERS });
  }

  function handlePageChange(page: number) {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Result range text
  const startResult = (filters.page - 1) * 12 + 1;
  const endResult = Math.min(filters.page * 12, total);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Browse Therapists
        </h1>
        <p className="mt-1 text-neutral-500">
          Find your perfect massage therapist
        </p>
      </div>

      {/* Mobile filter bar + sort */}
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <FilterSidebar
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
          resultCount={total}
        />
        <select
          value={filters.sort}
          onChange={(e) =>
            handleFilterChange({ ...filters, sort: e.target.value, page: 1 })
          }
          className="input max-w-[180px]"
        >
          <option value="rating">Highest Rated</option>
          <option value="price_asc">Price: Low-High</option>
          <option value="price_desc">Price: High-Low</option>
          <option value="newest">Newest</option>
          <option value="reviews">Most Reviews</option>
        </select>
      </div>

      {/* Active filter tags */}
      <div className="mb-4">
        <ActiveFilterTags filters={filters} onChange={handleFilterChange} />
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <FilterSidebar
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
            resultCount={total}
          />
        </div>

        {/* Results */}
        <div className="min-w-0 flex-1">
          {/* Result count */}
          {!isLoading && total > 0 && (
            <p className="mb-4 text-sm text-neutral-500">
              Showing{" "}
              <span className="font-medium text-neutral-700">
                {startResult}-{endResult}
              </span>{" "}
              of{" "}
              <span className="font-medium text-neutral-700">{total}</span>{" "}
              therapists
            </p>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <TherapistCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Results grid */}
          {!isLoading && therapists.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {therapists.map((t) => (
                <TherapistCard key={t.id} therapist={t} />
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && therapists.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
                <SearchX className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                No therapists found
              </h3>
              <p className="mt-1 max-w-sm text-center text-sm text-neutral-500">
                Try adjusting your filters, expanding your location, or clearing
                some selections to see more results.
              </p>
              <button
                onClick={handleClearFilters}
                className="btn-secondary mt-6"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={filters.page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TherapistsPage() {
  return (
    <Suspense>
      <TherapistsContent />
    </Suspense>
  );
}
