"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-50">
          <svg
            className="h-7 w-7 text-error-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-neutral-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary px-5 py-2.5 text-sm">
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
