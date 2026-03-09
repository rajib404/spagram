export default function TherapistsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6">
        <div className="h-8 w-52 animate-pulse rounded bg-neutral-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-neutral-100" />
      </div>

      {/* Filter bar placeholder */}
      <div className="mb-4 h-10 w-32 animate-pulse rounded-lg bg-neutral-100 lg:hidden" />

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <div className="hidden w-64 flex-shrink-0 space-y-4 lg:block">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
              <div className="h-9 w-full animate-pulse rounded-lg bg-neutral-100" />
            </div>
          ))}
        </div>

        {/* Results grid */}
        <div className="min-w-0 flex-1">
          <div className="mb-4 h-4 w-48 animate-pulse rounded bg-neutral-100" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
              >
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
