"use client";

import { Search, CalendarDays, Heart } from "lucide-react";
import { ScrollAnimate } from "@/components/shared/scroll-animate";

const STEPS = [
  {
    icon: Search,
    step: "1",
    title: "Search",
    description:
      "Browse therapists by location, massage type, price, and availability. Read reviews and compare profiles.",
  },
  {
    icon: CalendarDays,
    step: "2",
    title: "Book",
    description:
      "Pick your preferred date, time, and session length. Choose in-call or out-call and pay securely online.",
  },
  {
    icon: Heart,
    step: "3",
    title: "Relax",
    description:
      "Enjoy your session with a verified professional. Leave a review to help others find great therapists.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollAnimate>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-lg text-neutral-500">
              Getting a great massage is just three simple steps away
            </p>
          </div>
        </ScrollAnimate>

        <div className="relative mt-16">
          {/* Connector line (desktop) */}
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-neutral-200 lg:block" />

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <ScrollAnimate key={step.title} delay={i * 200}>
                <div className="relative text-center">
                  {/* Step number with icon */}
                  <div className="relative mx-auto">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-primary-50">
                      <step.icon className="h-10 w-10 text-primary-600" />
                    </div>
                    <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white ring-4 ring-white">
                      {step.step}
                    </div>
                  </div>

                  <h3 className="mt-6 text-xl font-semibold text-neutral-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                    {step.description}
                  </p>
                </div>
              </ScrollAnimate>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
