"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ProfileData } from "@/app/(dashboard)/therapist/profile/page";

const MASSAGE_TYPES = [
  "Swedish", "Deep Tissue", "Sports", "Hot Stone", "Thai",
  "Aromatherapy", "Shiatsu", "Reflexology", "Prenatal",
  "Couples", "Lymphatic Drainage", "Trigger Point",
  "Myofascial Release", "Craniosacral", "Cupping",
  "Chair Massage", "Bamboo", "Lomi Lomi",
];

const schema = z.object({
  massageTypes: z.array(z.string()).min(1, "Select at least one service"),
  incallPricePerHour: z.string().optional().or(z.literal("")),
  outcallPricePerHour: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Props {
  profile: ProfileData;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}

export function ServicesTab({ profile, onSave }: Props) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      massageTypes: profile.massageTypes || [],
      incallPricePerHour: profile.incallPricePerHour || "",
      outcallPricePerHour: profile.outcallPricePerHour || "",
    },
  });

  const selectedTypes = watch("massageTypes");

  function toggleType(type: string) {
    const current = selectedTypes || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setValue("massageTypes", updated, { shouldDirty: true });
  }

  async function onSubmit(data: FormData) {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-xl">
      {/* Massage Types */}
      <div>
        <h3 className="font-semibold text-neutral-900 mb-1">
          Services Offered <span className="text-error-500">*</span>
        </h3>
        <p className="text-sm text-neutral-500 mb-4">
          Select the massage types you offer.
        </p>
        <div className="flex flex-wrap gap-2">
          {MASSAGE_TYPES.map((type) => {
            const isSelected = (selectedTypes || []).includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors",
                  isSelected
                    ? "bg-primary-50 border-primary-300 text-primary-700"
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                )}
              >
                {isSelected && (
                  <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                {type}
              </button>
            );
          })}
        </div>
        {/* Hidden input for form registration */}
        <input type="hidden" {...register("massageTypes")} />
        {errors.massageTypes && (
          <p className="text-sm text-error-600 mt-2">{errors.massageTypes.message}</p>
        )}
      </div>

      {/* Pricing */}
      <div className="border-t border-neutral-100 pt-6">
        <h3 className="font-semibold text-neutral-900 mb-1">Pricing</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Set your hourly rate. A 10% booking fee is charged to clients on top of your rate.
        </p>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Incall Price / Hour
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
              <input
                {...register("incallPricePerHour")}
                type="number"
                min={0}
                step={5}
                className="input w-full pl-7"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Outcall Price / Hour
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
              <input
                {...register("outcallPricePerHour")}
                type="number"
                min={0}
                step={5}
                className="input w-full pl-7"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-100">
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="btn-primary px-6 py-2.5 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
