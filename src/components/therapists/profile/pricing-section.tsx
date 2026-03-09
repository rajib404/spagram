import { Home, Navigation, Info } from "lucide-react";

interface PricingSectionProps {
  incallAvailable: boolean;
  outcallAvailable: boolean;
  incallPricePerHour: string | number | null;
  outcallPricePerHour: string | number | null;
}

export function PricingSection({
  incallAvailable,
  outcallAvailable,
  incallPricePerHour,
  outcallPricePerHour,
}: PricingSectionProps) {
  return (
    <section id="pricing">
      <h2 className="text-xl font-semibold text-neutral-900">Pricing</h2>

      <div className="mt-4 space-y-3">
        {incallAvailable && incallPricePerHour && (
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                <Home className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Incall</p>
                <p className="text-xs text-neutral-500">
                  Visit therapist&apos;s location
                </p>
              </div>
            </div>
            <p className="text-lg font-semibold text-neutral-900">
              ${Number(incallPricePerHour)}
              <span className="text-sm font-normal text-neutral-400">/hr</span>
            </p>
          </div>
        )}

        {outcallAvailable && outcallPricePerHour && (
          <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50">
                <Navigation className="h-4 w-4 text-success-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Outcall</p>
                <p className="text-xs text-neutral-500">
                  Therapist comes to you
                </p>
              </div>
            </div>
            <p className="text-lg font-semibold text-neutral-900">
              ${Number(outcallPricePerHour)}
              <span className="text-sm font-normal text-neutral-400">/hr</span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
        <p className="text-xs text-neutral-500">
          A 10% booking fee is added at checkout to cover platform and payment
          processing costs.
        </p>
      </div>
    </section>
  );
}
