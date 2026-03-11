"use client";

import { ShieldCheck, CalendarCheck, CreditCard } from "lucide-react";
import { ScrollAnimate } from "@/components/shared/scroll-animate";

const PROPS = [
  {
    icon: ShieldCheck,
    title: "Verified Therapists",
    description:
      "Every therapist is identity-verified and credentialed. Browse real reviews from real clients to find your perfect match.",
    color: "bg-success-50 text-success-600",
  },
  {
    icon: CalendarCheck,
    title: "Easy Booking",
    description:
      "See real-time availability, book in seconds, and manage appointments from your dashboard. No phone calls needed.",
    color: "bg-primary-50 text-primary-600",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description:
      "Pay safely through our platform with Stripe. Your payment is held until after your session is completed.",
    color: "bg-amber-50 text-amber-600",
  },
];

export function ValueProps() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollAnimate>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Why choose Sparina
            </h2>
            <p className="mt-3 text-lg text-neutral-500">
              We make finding and booking massage therapy simple, safe, and
              reliable.
            </p>
          </div>
        </ScrollAnimate>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PROPS.map((prop, i) => (
            <ScrollAnimate key={prop.title} delay={i * 150}>
              <div className="group rounded-2xl border border-neutral-200 bg-white p-7 transition-all hover:border-neutral-300 hover:shadow-lg">
                <div
                  className={`inline-flex rounded-xl p-3 ${prop.color}`}
                >
                  <prop.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                  {prop.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {prop.description}
                </p>
              </div>
            </ScrollAnimate>
          ))}
        </div>
      </div>
    </section>
  );
}
