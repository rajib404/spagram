"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import type { ProfileData } from "@/app/(dashboard)/therapist/profile/page";

const schema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  tagline: z.string().max(120, "Tagline must be 120 characters or less").optional().or(z.literal("")),
  bio: z.string().max(2000, "Bio must be 2000 characters or less").optional().or(z.literal("")),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  profile: ProfileData;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}

export function BasicInfoTab({ profile, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: profile.displayName,
      tagline: profile.tagline || "",
      bio: profile.bio || "",
      slug: profile.slug,
    },
  });

  const slugValue = watch("slug");
  const bioValue = watch("bio");

  useEffect(() => {
    if (slugValue === profile.slug || !slugValue || slugValue.length < 3) {
      setSlugStatus("idle");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slugValue)) {
      setSlugStatus("idle");
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus("checking");
      try {
        const res = await fetch(`/api/therapist/slug-check?slug=${slugValue}`);
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
      } catch {
        setSlugStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [slugValue, profile.slug]);

  async function onSubmit(data: FormData) {
    if (slugStatus === "taken") return;
    setSaving(true);
    await onSave(data);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Display Name <span className="text-error-500">*</span>
        </label>
        <input
          {...register("displayName")}
          className="input w-full"
          placeholder="Your professional name"
        />
        {errors.displayName && (
          <p className="text-sm text-error-600 mt-1">{errors.displayName.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Tagline
        </label>
        <input
          {...register("tagline")}
          className="input w-full"
          placeholder="A short description of your services"
          maxLength={120}
        />
        {errors.tagline && (
          <p className="text-sm text-error-600 mt-1">{errors.tagline.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Bio
        </label>
        <textarea
          {...register("bio")}
          className="input w-full min-h-[160px] resize-y"
          placeholder="Tell clients about your experience, specialties, and approach..."
          maxLength={2000}
        />
        <div className="flex justify-between mt-1">
          {errors.bio ? (
            <p className="text-sm text-error-600">{errors.bio.message}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-neutral-400">
            {(bioValue || "").length}/2000
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          Profile URL
        </label>
        <div className="flex items-center gap-0">
          <span className="px-3 py-2 bg-neutral-100 border border-r-0 border-neutral-300 rounded-l-lg text-sm text-neutral-500">
            sparina.com/therapists/
          </span>
          <input
            {...register("slug")}
            className="input rounded-l-none flex-1"
            placeholder="your-slug"
          />
        </div>
        {errors.slug && (
          <p className="text-sm text-error-600 mt-1">{errors.slug.message}</p>
        )}
        {slugStatus === "checking" && (
          <p className="text-sm text-neutral-400 mt-1">Checking availability...</p>
        )}
        {slugStatus === "available" && (
          <p className="text-sm text-success-600 mt-1">This URL is available</p>
        )}
        {slugStatus === "taken" && (
          <p className="text-sm text-error-600 mt-1">This URL is already taken</p>
        )}
      </div>

      <div className="pt-4 border-t border-neutral-100">
        <button
          type="submit"
          disabled={saving || !isDirty || slugStatus === "taken"}
          className="btn-primary px-6 py-2.5 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
