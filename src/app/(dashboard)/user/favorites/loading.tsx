export default function UserFavoritesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="h-7 w-36 animate-pulse rounded bg-neutral-200" />

      {/* Card grid */}
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
