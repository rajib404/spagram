"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 font-sans">
        <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-neutral-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            An unexpected error occurred. Please try reloading the page.
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
