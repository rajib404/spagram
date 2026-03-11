import Link from "next/link";

export const metadata = {
  title: "About Us | Sparina",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900">About Sparina</h1>
      <div className="mt-8 space-y-6 text-neutral-600 leading-relaxed">
        <p>
          Sparina is a platform that connects clients with verified, professional
          massage therapists. Whether you prefer an in-call visit to a
          therapist&apos;s studio or an out-call session in the comfort of your
          own home, Sparina makes it easy to find and book the right therapist
          for your needs.
        </p>
        <p>
          Our mission is to make professional massage therapy accessible,
          transparent, and trustworthy. Every therapist on our platform is
          verified, and our review system ensures you can book with confidence.
        </p>
        <h2 className="text-xl font-semibold text-neutral-900 pt-4">
          Why Sparina?
        </h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Verified and vetted massage therapists</li>
          <li>Transparent pricing with no hidden fees</li>
          <li>Easy online booking and scheduling</li>
          <li>Secure payments processed through Stripe</li>
          <li>Honest reviews from real clients</li>
        </ul>
        <p>
          Have questions?{" "}
          <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
            Get in touch
          </Link>{" "}
          — we&apos;d love to hear from you.
        </p>
      </div>
    </div>
  );
}
