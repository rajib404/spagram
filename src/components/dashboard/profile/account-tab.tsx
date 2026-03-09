"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import type { UserData } from "@/app/(dashboard)/therapist/profile/page";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
  currentPassword: z.string().optional().or(z.literal("")),
  newPassword: z.string().optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) return false;
    return true;
  },
  { message: "Current password is required to set a new password", path: ["currentPassword"] }
).refine(
  (data) => {
    if (data.newPassword && data.newPassword.length < 8) return false;
    return true;
  },
  { message: "New password must be at least 8 characters", path: ["newPassword"] }
).refine(
  (data) => {
    if (data.newPassword && data.newPassword !== data.confirmPassword) return false;
    return true;
  },
  { message: "Passwords do not match", path: ["confirmPassword"] }
);

type FormData = z.infer<typeof schema>;

interface Props {
  user: UserData;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}

export function AccountTab({ user, onSave }: Props) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user.email,
      phone: user.phone || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: FormData) {
    setSaving(true);
    const success = await onSave({
      email: data.email,
      phone: data.phone,
      currentPassword: data.currentPassword || undefined,
      newPassword: data.newPassword || undefined,
    });

    if (success) {
      reset({
        email: data.email,
        phone: data.phone || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
      {/* Email & Phone */}
      <div>
        <h3 className="font-semibold text-neutral-900 mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Email Address <span className="text-error-500">*</span>
            </label>
            <input
              {...register("email")}
              type="email"
              className="input w-full"
            />
            {errors.email && (
              <p className="text-sm text-error-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Phone Number
            </label>
            <input
              {...register("phone")}
              type="tel"
              className="input w-full"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="border-t border-neutral-100 pt-6">
        <h3 className="font-semibold text-neutral-900 mb-1">Change Password</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Leave blank to keep your current password.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Current Password
            </label>
            <input
              {...register("currentPassword")}
              type="password"
              className="input w-full"
              autoComplete="current-password"
            />
            {errors.currentPassword && (
              <p className="text-sm text-error-600 mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              New Password
            </label>
            <input
              {...register("newPassword")}
              type="password"
              className="input w-full"
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
            />
            {errors.newPassword && (
              <p className="text-sm text-error-600 mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              {...register("confirmPassword")}
              type="password"
              className="input w-full"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-error-600 mt-1">{errors.confirmPassword.message}</p>
            )}
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
