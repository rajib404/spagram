export const metadata = {
  title: "Contact | Sparina",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900">Contact Us</h1>
      <div className="mt-8 space-y-6 text-neutral-600 leading-relaxed">
        <p>
          We&apos;re here to help. Whether you have a question about our
          platform, need support with a booking, or want to provide feedback,
          reach out and we&apos;ll get back to you as soon as possible.
        </p>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Email</h2>
            <p className="mt-1 text-sm">support@sparina.com</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Business Hours
            </h2>
            <p className="mt-1 text-sm">
              Monday &ndash; Friday, 9:00 AM &ndash; 6:00 PM (EST)
            </p>
          </div>
        </div>
        <p className="text-sm text-neutral-500">
          For urgent issues related to an active booking, please include your
          booking ID in your message so we can assist you faster.
        </p>
      </div>
    </div>
  );
}
