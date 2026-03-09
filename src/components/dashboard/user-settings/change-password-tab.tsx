"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { changePasswordSchema } from "@/lib/validations";

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export function ChangePasswordTab() {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
  });

  async function onSubmit(data: ChangePasswordData) {
    setSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to change password");

      toast.success("Password changed successfully");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Change Password
        </h3>
        <p className="text-sm text-neutral-500">
          Update your password to keep your account secure.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Current Password
        </label>
        <input
          type="password"
          {...register("currentPassword")}
          placeholder="Enter current password"
          className="input w-full"
        />
        {errors.currentPassword && (
          <p className="text-xs text-error-500 mt-1">{errors.currentPassword.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          New Password
        </label>
        <input
          type="password"
          {...register("newPassword")}
          placeholder="At least 8 characters"
          className="input w-full"
        />
        {errors.newPassword && (
          <p className="text-xs text-error-500 mt-1">{errors.newPassword.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Confirm New Password
        </label>
        <input
          type="password"
          {...register("confirmPassword")}
          placeholder="Re-enter new password"
          className="input w-full"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-error-500 mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
      >
        {saving ? "Changing..." : "Change Password"}
      </button>
    </form>
  );
}
