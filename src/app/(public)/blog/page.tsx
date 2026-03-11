export const metadata = {
  title: "Blog | Sparina",
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900">Blog</h1>
      <div className="mt-8 space-y-6 text-neutral-600 leading-relaxed">
        <p>
          Tips, guides, and news from the Sparina team about massage therapy,
          wellness, and our platform.
        </p>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
          <p className="text-sm font-medium text-neutral-900">Coming soon</p>
          <p className="mt-2 text-sm text-neutral-500">
            We&apos;re working on our first posts. Check back soon for articles
            on massage therapy tips, therapist spotlights, and platform updates.
          </p>
        </div>
      </div>
    </div>
  );
}
