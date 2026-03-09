export default function TherapistReviewsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="h-7 w-36 animate-pulse rounded bg-neutral-200" />

      {/* Summary card */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-6">
          <div className="text-center space-y-2">
            <div className="h-10 w-16 animate-pulse rounded bg-neutral-200 mx-auto" />
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className="h-4 w-4 animate-pulse rounded bg-neutral-200"
                />
              ))}
            </div>
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-100 mx-auto" />
          </div>
          <div className="flex-1 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-6 animate-pulse rounded bg-neutral-100" />
                <div className="h-2 flex-1 animate-pulse rounded-full bg-neutral-100" />
                <div className="h-3 w-6 animate-pulse rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-36 animate-pulse rounded bg-neutral-200" />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div
                      key={s}
                      className="h-4 w-4 animate-pulse rounded bg-neutral-200"
                    />
                  ))}
                </div>
              </div>
              <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
