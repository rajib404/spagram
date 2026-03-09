"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollAnimate } from "@/components/shared/scroll-animate";

export function CtaSection() {
  return (
    <section className="bg-primary-950 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollAnimate>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-14 sm:px-16 sm:py-20">
            {/* Decorative circles */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/20" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary-400/10" />

            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to feel your best?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-primary-100/80">
                Join thousands of satisfied clients. Find a therapist that fits
                your needs and book your first session today.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/therapists"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
                >
                  Browse therapists
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Create free account
                </Link>
              </div>
            </div>
          </div>
        </ScrollAnimate>
      </div>
    </section>
  );
}
