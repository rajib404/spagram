"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Sparkles } from "lucide-react";

const MASSAGE_TYPES = [
  "All Types",
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

export function HeroSection() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [massageType, setMassageType] = useState("All Types");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (massageType && massageType !== "All Types")
      params.set("type", massageType);
    router.push(`/therapists?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-400/30 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-200">
            <Sparkles className="h-3.5 w-3.5" />
            Trusted by thousands of clients
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find Your Perfect{" "}
            <span className="bg-gradient-to-r from-primary-300 to-primary-100 bg-clip-text text-transparent">
              Massage Therapist
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-primary-200/80">
            Browse verified professionals, book in-call or out-call sessions,
            and pay securely — all in one place.
          </p>

          {/* Search form */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 max-w-2xl"
          >
            <div className="flex flex-col gap-3 rounded-2xl bg-white p-2 shadow-2xl shadow-primary-950/30 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-1.5">
              {/* Location */}
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="City or state..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-full border-0 bg-transparent py-3 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-0"
                />
              </div>

              {/* Divider (desktop) */}
              <div className="hidden h-8 w-px bg-neutral-200 sm:block" />

              {/* Massage type */}
              <div className="relative flex-1">
                <select
                  value={massageType}
                  onChange={(e) => setMassageType(e.target.value)}
                  className="w-full appearance-none rounded-full border-0 bg-transparent py-3 pl-4 pr-8 text-sm text-neutral-900 focus:outline-none focus:ring-0"
                >
                  {MASSAGE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </div>

              {/* Search button */}
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Quick links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-primary-300/70">
            <span>Popular:</span>
            {["Deep Tissue", "Swedish", "Sports", "Thai"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setMassageType(type);
                  router.push(`/therapists?type=${type}`);
                }}
                className="rounded-full border border-primary-500/20 px-3 py-1 text-primary-200 transition-colors hover:border-primary-400/40 hover:text-white"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 56"
          fill="none"
          className="w-full text-white"
          preserveAspectRatio="none"
        >
          <path
            d="M0 24C240 54 480 54 720 36C960 18 1200 18 1440 36V56H0V24Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}
