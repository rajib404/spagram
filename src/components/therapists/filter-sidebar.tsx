"use client";

import { useState, useEffect } from "react";
import {
  X,
  SlidersHorizontal,
  ChevronDown,
  Star,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RangeSlider } from "@/components/ui/range-slider";

const MASSAGE_TYPES = [
  "Swedish",
  "Deep Tissue",
  "Thai",
  "Sports",
  "Hot Stone",
  "Aromatherapy",
  "Reflexology",
  "Shiatsu",
  "Couples",
  "Prenatal",
];

const ETHNICITIES = [
  "White",
  "Black",
  "Hispanic",
  "Asian",
  "South Asian",
];

const SORT_OPTIONS = [
  { value: "rating", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "reviews", label: "Most Reviews" },
];

export interface Filters {
  state: string;
  city: string;
  borough: string;
  types: string[];
  serviceType: string;
  gender: string;
  ethnicity: string[];
  ageRange: [number, number];
  priceRange: [number, number];
  minRating: number;
  date: string;
  sort: string;
  page: number;
}

export const DEFAULT_FILTERS: Filters = {
  state: "",
  city: "",
  borough: "",
  types: [],
  serviceType: "",
  gender: "",
  ethnicity: [],
  ageRange: [18, 65],
  priceRange: [0, 500],
  minRating: 0,
  date: "",
  sort: "rating",
  page: 1,
};

interface FilterSidebarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
  resultCount: number;
}

export function FilterSidebar({
  filters,
  onChange,
  onClear,
  resultCount,
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount = countActiveFilters(filters);

  function update(partial: Partial<Filters>) {
    onChange({ ...filters, ...partial, page: 1 });
  }

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "lg:sticky lg:top-20 lg:block lg:h-fit lg:w-72 lg:flex-shrink-0",
          // Mobile: slide-out drawer
          mobileOpen
            ? "fixed inset-y-0 left-0 z-50 block w-80 max-w-[85vw] overflow-y-auto bg-white shadow-2xl"
            : "hidden"
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-4 lg:hidden">
          <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1 p-4 lg:p-0">
          {/* Sort */}
          <FilterSection title="Sort by" defaultOpen>
            <select
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value })}
              className="input"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterSection>

          {/* Location */}
          <FilterSection title="Location" defaultOpen>
            <LocationCascade
              state={filters.state}
              city={filters.city}
              borough={filters.borough}
              onChange={(loc) => update(loc)}
            />
          </FilterSection>

          {/* Massage type */}
          <FilterSection title="Massage Type" defaultOpen>
            <div className="max-h-52 space-y-1.5 overflow-y-auto">
              {MASSAGE_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type)}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...filters.types, type]
                        : filters.types.filter((t) => t !== type);
                      update({ types });
                    }}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  {type}
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Service Type */}
          <FilterSection title="Service Type">
            <div className="flex gap-2">
              {[
                { value: "", label: "Both" },
                { value: "incall", label: "Incall" },
                { value: "outcall", label: "Outcall" },
              ].map((o) => (
                <button
                  key={o.value}
                  onClick={() => update({ serviceType: o.value })}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                    filters.serviceType === o.value
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Gender */}
          <FilterSection title="Gender">
            <div className="flex gap-2">
              {[
                { value: "", label: "Any" },
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
              ].map((o) => (
                <button
                  key={o.value}
                  onClick={() => update({ gender: o.value })}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                    filters.gender === o.value
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Ethnicity */}
          <FilterSection title="Ethnicity">
            <div className="space-y-1.5">
              {ETHNICITIES.map((eth) => (
                <label
                  key={eth}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-neutral-50"
                >
                  <input
                    type="checkbox"
                    checked={filters.ethnicity.includes(eth)}
                    onChange={(e) => {
                      const ethnicity = e.target.checked
                        ? [...filters.ethnicity, eth]
                        : filters.ethnicity.filter((v) => v !== eth);
                      update({ ethnicity });
                    }}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  {eth}
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Age Range */}
          <FilterSection title="Age Range">
            <RangeSlider
              min={18}
              max={65}
              value={filters.ageRange}
              onChange={(ageRange) => update({ ageRange })}
              formatLabel={(v) => `${v} yrs`}
            />
          </FilterSection>

          {/* Price Range */}
          <FilterSection title="Price Range">
            <RangeSlider
              min={0}
              max={500}
              step={10}
              value={filters.priceRange}
              onChange={(priceRange) => update({ priceRange })}
              formatLabel={(v) => `$${v}`}
            />
          </FilterSection>

          {/* Min Rating */}
          <FilterSection title="Minimum Rating">
            <div className="flex gap-1">
              {[0, 3, 3.5, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => update({ minRating: r })}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    filters.minRating === r
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  )}
                >
                  {r === 0 ? (
                    "Any"
                  ) : (
                    <>
                      {r}
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </>
                  )}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Date Availability */}
          <FilterSection title="Available On">
            <input
              type="date"
              value={filters.date}
              onChange={(e) => update({ date: e.target.value })}
              className="input"
              min={new Date().toISOString().split("T")[0]}
            />
          </FilterSection>

          {/* Clear all */}
          {activeCount > 0 && (
            <button
              onClick={() => {
                onClear();
                setMobileOpen(false);
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          )}
        </div>

        {/* Mobile footer */}
        <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(false)}
            className="btn-primary w-full"
          >
            Show {resultCount} results
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Collapsible filter section ──────────────────────────────────────────────── */

function FilterSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-100 py-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-medium text-neutral-800"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-neutral-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

/* ── Cascading location dropdowns ────────────────────────────────────────────── */

function LocationCascade({
  state,
  city,
  borough,
  onChange,
}: {
  state: string;
  city: string;
  borough: string;
  onChange: (loc: { state: string; city: string; borough: string }) => void;
}) {
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [boroughs, setBoroughs] = useState<string[]>([]);

  // Fetch states on mount
  useEffect(() => {
    fetch("/api/therapists/locations")
      .then((r) => r.json())
      .then((d) => setStates(d.states || []))
      .catch(() => {});
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (!state) {
      setCities([]);
      setBoroughs([]);
      return;
    }
    fetch(`/api/therapists/locations?state=${encodeURIComponent(state)}`)
      .then((r) => r.json())
      .then((d) => setCities(d.cities || []))
      .catch(() => {});
  }, [state]);

  // Fetch boroughs when city changes
  useEffect(() => {
    if (!state || !city) {
      setBoroughs([]);
      return;
    }
    fetch(
      `/api/therapists/locations?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`
    )
      .then((r) => r.json())
      .then((d) => setBoroughs(d.boroughs || []))
      .catch(() => {});
  }, [state, city]);

  return (
    <div className="space-y-2">
      <select
        value={state}
        onChange={(e) =>
          onChange({ state: e.target.value, city: "", borough: "" })
        }
        className="input"
      >
        <option value="">All States</option>
        {states.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {cities.length > 0 && (
        <select
          value={city}
          onChange={(e) =>
            onChange({ state, city: e.target.value, borough: "" })
          }
          className="input"
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}

      {boroughs.length > 0 && (
        <select
          value={borough}
          onChange={(e) =>
            onChange({ state, city, borough: e.target.value })
          }
          className="input"
        >
          <option value="">All Boroughs</option>
          {boroughs.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

/* ── Active filter tag display ───────────────────────────────────────────────── */

export function ActiveFilterTags({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  const tags: { label: string; onRemove: () => void }[] = [];

  if (filters.state) {
    const label = filters.borough
      ? `${filters.borough}, ${filters.city}`
      : filters.city
        ? `${filters.city}, ${filters.state}`
        : filters.state;
    tags.push({
      label,
      onRemove: () =>
        onChange({ ...filters, state: "", city: "", borough: "", page: 1 }),
    });
  }

  for (const type of filters.types) {
    tags.push({
      label: type,
      onRemove: () =>
        onChange({
          ...filters,
          types: filters.types.filter((t) => t !== type),
          page: 1,
        }),
    });
  }

  if (filters.serviceType) {
    tags.push({
      label: filters.serviceType === "incall" ? "Incall" : "Outcall",
      onRemove: () => onChange({ ...filters, serviceType: "", page: 1 }),
    });
  }

  if (filters.gender) {
    tags.push({
      label: filters.gender,
      onRemove: () => onChange({ ...filters, gender: "", page: 1 }),
    });
  }

  for (const eth of filters.ethnicity) {
    tags.push({
      label: eth,
      onRemove: () =>
        onChange({
          ...filters,
          ethnicity: filters.ethnicity.filter((e) => e !== eth),
          page: 1,
        }),
    });
  }

  if (
    filters.ageRange[0] !== DEFAULT_FILTERS.ageRange[0] ||
    filters.ageRange[1] !== DEFAULT_FILTERS.ageRange[1]
  ) {
    tags.push({
      label: `Age ${filters.ageRange[0]}-${filters.ageRange[1]}`,
      onRemove: () =>
        onChange({ ...filters, ageRange: DEFAULT_FILTERS.ageRange, page: 1 }),
    });
  }

  if (
    filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] ||
    filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1]
  ) {
    tags.push({
      label: `$${filters.priceRange[0]}-$${filters.priceRange[1]}/hr`,
      onRemove: () =>
        onChange({
          ...filters,
          priceRange: DEFAULT_FILTERS.priceRange,
          page: 1,
        }),
    });
  }

  if (filters.minRating > 0) {
    tags.push({
      label: `${filters.minRating}+ stars`,
      onRemove: () => onChange({ ...filters, minRating: 0, page: 1 }),
    });
  }

  if (filters.date) {
    tags.push({
      label: `Available ${filters.date}`,
      onRemove: () => onChange({ ...filters, date: "", page: 1 }),
    });
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, i) => (
        <span
          key={`${tag.label}-${i}`}
          className="inline-flex items-center gap-1 rounded-full bg-primary-50 py-1 pl-3 pr-1.5 text-xs font-medium text-primary-700"
        >
          {tag.label}
          <button
            onClick={tag.onRemove}
            className="flex h-4 w-4 items-center justify-center rounded-full text-primary-400 hover:bg-primary-100 hover:text-primary-600"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

function countActiveFilters(filters: Filters): number {
  let count = 0;
  if (filters.state) count++;
  count += filters.types.length;
  if (filters.serviceType) count++;
  if (filters.gender) count++;
  count += filters.ethnicity.length;
  if (
    filters.ageRange[0] !== DEFAULT_FILTERS.ageRange[0] ||
    filters.ageRange[1] !== DEFAULT_FILTERS.ageRange[1]
  )
    count++;
  if (
    filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] ||
    filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1]
  )
    count++;
  if (filters.minRating > 0) count++;
  if (filters.date) count++;
  return count;
}
