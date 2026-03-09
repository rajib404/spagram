"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import type { ProfileData } from "@/app/(dashboard)/therapist/profile/page";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

const schema = z.object({
  state: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  borough: z.string().optional().or(z.literal("")),
  fullAddress: z.string().optional().or(z.literal("")),
  incallAvailable: z.boolean(),
  outcallAvailable: z.boolean(),
  incallAddress: z.string().optional().or(z.literal("")),
  outcallRadius: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface Props {
  profile: ProfileData;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}

export function LocationTab({ profile, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      state: profile.state || "",
      city: profile.city || "",
      borough: profile.borough || "",
      fullAddress: profile.fullAddress || "",
      incallAvailable: profile.incallAvailable,
      outcallAvailable: profile.outcallAvailable,
      incallAddress: profile.incallAddress || "",
      outcallRadius: profile.outcallRadius?.toString() || "",
    },
  });

  const stateValue = watch("state");
  const incallAvailable = watch("incallAvailable");
  const outcallAvailable = watch("outcallAvailable");

  useEffect(() => {
    if (!stateValue) {
      setCities([]);
      return;
    }

    fetch(`/api/therapists/locations?state=${encodeURIComponent(stateValue)}`)
      .then((res) => res.json())
      .then((data) => setCities(data.cities || []))
      .catch(() => setCities([]));
  }, [stateValue]);

  async function onSubmit(data: FormData) {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            State
          </label>
          <select {...register("state")} className="input w-full">
            <option value="">Select state...</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            City
          </label>
          {cities.length > 0 ? (
            <select {...register("city")} className="input w-full">
              <option value="">Select city...</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input
              {...register("city")}
              className="input w-full"
              placeholder="Enter city"
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Borough / Neighborhood
        </label>
        <input
          {...register("borough")}
          className="input w-full"
          placeholder="e.g. Midtown, Downtown"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Full Address (for incall appointments)
        </label>
        <input
          {...register("fullAddress")}
          className="input w-full"
          placeholder="Street address (only shared after booking is confirmed)"
        />
        <p className="text-xs text-neutral-400 mt-1">
          This address is only shared with clients after they confirm a booking.
        </p>
      </div>

      <div className="border-t border-neutral-100 pt-6 space-y-4">
        <h3 className="font-semibold text-neutral-900">Service Locations</h3>

        <label className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors cursor-pointer">
          <div>
            <p className="font-medium text-neutral-900">Incall Available</p>
            <p className="text-sm text-neutral-500">Clients come to your location</p>
          </div>
          <input
            type="checkbox"
            {...register("incallAvailable")}
            className="w-5 h-5 rounded text-primary-600 border-neutral-300 focus:ring-primary-500"
          />
        </label>

        {incallAvailable && (
          <div className="ml-4 pl-4 border-l-2 border-primary-100">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Incall Address
            </label>
            <input
              {...register("incallAddress")}
              className="input w-full"
              placeholder="Studio or office address"
            />
          </div>
        )}

        <label className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors cursor-pointer">
          <div>
            <p className="font-medium text-neutral-900">Outcall Available</p>
            <p className="text-sm text-neutral-500">You travel to the client</p>
          </div>
          <input
            type="checkbox"
            {...register("outcallAvailable")}
            className="w-5 h-5 rounded text-primary-600 border-neutral-300 focus:ring-primary-500"
          />
        </label>

        {outcallAvailable && (
          <div className="ml-4 pl-4 border-l-2 border-primary-100">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Outcall Radius (miles)
            </label>
            <input
              {...register("outcallRadius")}
              type="number"
              min={1}
              max={100}
              className="input w-32"
              placeholder="e.g. 15"
            />
            {errors.outcallRadius && (
              <p className="text-sm text-error-600 mt-1">{errors.outcallRadius.message}</p>
            )}
          </div>
        )}
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
