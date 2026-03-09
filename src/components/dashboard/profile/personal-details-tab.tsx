"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import type { ProfileData } from "@/app/(dashboard)/therapist/profile/page";

const schema = z.object({
  gender: z.string().optional().or(z.literal("")),
  ethnicity: z.string().optional().or(z.literal("")),
  age: z.string().optional().or(z.literal("")),
  height: z.string().optional().or(z.literal("")),
  weight: z.string().optional().or(z.literal("")),
  hairColor: z.string().optional().or(z.literal("")),
  eyeColor: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

const GENDER_OPTIONS = ["Female", "Male", "Non-binary", "Other"];
const ETHNICITY_OPTIONS = [
  "Asian", "Black", "Caucasian", "Hispanic/Latino", "Middle Eastern",
  "Mixed", "Native American", "Pacific Islander", "Other",
];
const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "Auburn", "Gray", "White", "Other"];
const EYE_COLORS = ["Brown", "Blue", "Green", "Hazel", "Gray", "Amber", "Other"];

interface Props {
  profile: ProfileData;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}

export function PersonalDetailsTab({ profile, onSave }: Props) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: profile.gender || "",
      ethnicity: profile.ethnicity || "",
      age: profile.age?.toString() || "",
      height: profile.height || "",
      weight: profile.weight || "",
      hairColor: profile.hairColor || "",
      eyeColor: profile.eyeColor || "",
    },
  });

  async function onSubmit(data: FormData) {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <p className="text-sm text-neutral-500">
        These details help clients find and connect with you. All fields are optional.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Gender
          </label>
          <select {...register("gender")} className="input w-full">
            <option value="">Select...</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Ethnicity
          </label>
          <select {...register("ethnicity")} className="input w-full">
            <option value="">Select...</option>
            {ETHNICITY_OPTIONS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Age
          </label>
          <input
            {...register("age")}
            type="number"
            min={18}
            max={99}
            className="input w-full"
            placeholder="e.g. 28"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Height
          </label>
          <input
            {...register("height")}
            className="input w-full"
            placeholder={'e.g. 5\'7"'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Weight
          </label>
          <input
            {...register("weight")}
            className="input w-full"
            placeholder="e.g. 130 lbs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Hair Color
          </label>
          <select {...register("hairColor")} className="input w-full">
            <option value="">Select...</option>
            {HAIR_COLORS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Eye Color
          </label>
          <select {...register("eyeColor")} className="input w-full">
            <option value="">Select...</option>
            {EYE_COLORS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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
