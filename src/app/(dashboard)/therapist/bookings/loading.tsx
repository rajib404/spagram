export default function TherapistBookingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="h-7 w-36 animate-pulse rounded bg-neutral-200" />

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-neutral-200 pb-px">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 w-24 animate-pulse rounded-t bg-neutral-100"
          />
        ))}
      </div>

      {/* Booking cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200 bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200" />
                <div className="space-y-2">
                  <div className="h-4 w-36 animate-pulse rounded bg-neutral-200" />
                  <div className="h-3 w-48 animate-pulse rounded bg-neutral-100" />
                </div>
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-100" />
            </div>
            <div className="mt-4 flex gap-4">
              <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-16 animate-pulse rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
