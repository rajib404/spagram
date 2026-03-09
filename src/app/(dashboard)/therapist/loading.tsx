export default function TherapistDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-64 animate-pulse rounded bg-neutral-100" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200 bg-white p-5"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-neutral-200" />
          </div>
        ))}
      </div>

      {/* Table rows */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 p-5">
          <div className="h-5 w-40 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="divide-y divide-neutral-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-5">
              <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-56 animate-pulse rounded bg-neutral-100" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
