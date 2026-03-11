import Link from "next/link";

export const metadata = {
  title: "Therapist Resources | Sparina",
};

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900">
        Therapist Resources
      </h1>
      <div className="mt-8 space-y-6 text-neutral-600 leading-relaxed">
        <p>
          Everything you need to succeed on Sparina. From setting up your
          profile to managing bookings, we&apos;ve got you covered.
        </p>

        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 p-5">
            <h2 className="font-semibold text-neutral-900">Getting Started</h2>
            <p className="mt-2 text-sm">
              Create your account, complete your therapist profile, set your
              availability and pricing, and start receiving bookings.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-5">
            <h2 className="font-semibold text-neutral-900">
              Managing Your Schedule
            </h2>
            <p className="mt-2 text-sm">
              Use the availability calendar to set your working hours, block off
              time, and manage exceptions for holidays or time off.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-5">
            <h2 className="font-semibold text-neutral-900">
              Payments &amp; Earnings
            </h2>
            <p className="mt-2 text-sm">
              Payments are processed securely through Stripe. Track your
              earnings, view payout history, and manage your payment details from
              your dashboard.
            </p>
          </div>
        </div>

        <p>
          Ready to get started?{" "}
          <Link
            href="/register"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Join as a therapist
          </Link>
        </p>
      </div>
    </div>
  );
}
