export default function UserSettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="h-7 w-28 animate-pulse rounded bg-neutral-200" />

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-neutral-200 pb-px">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-9 w-28 animate-pulse rounded-t bg-neutral-100"
          />
        ))}
      </div>

      {/* Form fields */}
      <div className="max-w-lg space-y-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-100" />
          </div>
        ))}
        <div className="h-10 w-32 animate-pulse rounded-lg bg-neutral-200" />
      </div>
    </div>
  );
}
