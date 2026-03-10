import Link from "next/link";

export const metadata = {
  title: "Pricing | Spagram",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900">Pricing</h1>
      <div className="mt-8 space-y-6 text-neutral-600 leading-relaxed">
        <p>
          Spagram is free for clients. Therapists set their own session prices
          and Spagram takes a small platform fee on each completed booking.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 p-6">
            <h2 className="font-semibold text-neutral-900">For Clients</h2>
            <p className="mt-1 text-2xl font-bold text-primary-600">Free</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Browse and search therapists</li>
              <li>Book sessions online</li>
              <li>Secure payment processing</li>
              <li>Leave reviews</li>
            </ul>
          </div>

          <div className="rounded-xl border border-primary-200 bg-primary-50 p-6">
            <h2 className="font-semibold text-neutral-900">For Therapists</h2>
            <p className="mt-1 text-2xl font-bold text-primary-600">
              15% per booking
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Professional profile page</li>
              <li>Availability management</li>
              <li>Booking &amp; client management</li>
              <li>Earnings dashboard</li>
            </ul>
          </div>
        </div>

        <p>
          Questions about pricing?{" "}
          <Link
            href="/contact"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
