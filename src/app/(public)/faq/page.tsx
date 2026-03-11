import Link from "next/link";

export const metadata = {
  title: "FAQ | Sparina",
};

const FAQS = [
  {
    q: "How do I book a massage?",
    a: "Browse our therapist directory, select a therapist, choose an available time slot, and confirm your booking. Payment is processed securely through Stripe.",
  },
  {
    q: "How are therapists verified?",
    a: "All therapists go through a verification process before their profile is published. We review their credentials and professional background.",
  },
  {
    q: "What is the cancellation policy?",
    a: "Cancellation policies may vary by therapist. Check the therapist's profile for their specific policy before booking.",
  },
  {
    q: "How do payments work?",
    a: "Payments are processed securely through Stripe. You'll be charged when your booking is confirmed. Therapists receive their payout after the session is completed.",
  },
  {
    q: "Can I choose between in-call and out-call?",
    a: "Yes, many therapists offer both in-call (at their location) and out-call (at your location) sessions. Check the therapist's profile for available options.",
  },
  {
    q: "How do I become a therapist on Sparina?",
    a: "Register for an account, select 'Offer services', complete your profile setup, and submit for verification. Once approved, you'll start appearing in search results.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-neutral-900">
        Frequently Asked Questions
      </h1>
      <div className="mt-8 space-y-6">
        {FAQS.map((faq, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 p-5">
            <h2 className="font-semibold text-neutral-900">{faq.q}</h2>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-neutral-600">
        Still have questions?{" "}
        <Link
          href="/contact"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Contact us
        </Link>
      </p>
    </div>
  );
}
