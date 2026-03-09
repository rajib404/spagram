"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { deleteAccountSchema } from "@/lib/validations";

type DeleteAccountData = z.infer<typeof deleteAccountSchema>;

export function DeleteAccountTab() {
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DeleteAccountData>({
    resolver: zodResolver(deleteAccountSchema),
  });

  const confirmation = watch("confirmation");

  async function onSubmit(data: DeleteAccountData) {
    setDeleting(true);
    try {
      const res = await fetch("/api/user/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete account");

      toast.success("Account deleted");
      signOut({ callbackUrl: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-red-600 mb-1">
          Delete Account
        </h3>
        <p className="text-sm text-neutral-500">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
      </div>

      {!showForm ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-red-800 mb-1">
                What happens when you delete your account:
              </h4>
              <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                <li>All your personal information will be removed</li>
                <li>Any pending or upcoming bookings will be cancelled</li>
                <li>Your reviews will be deleted</li>
                <li>Your favorites will be removed</li>
                <li>This action is permanent and cannot be reversed</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            I understand, delete my account
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium">
              This is your final warning. This action is irreversible.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Enter your password
            </label>
            <input
              type="password"
              {...register("password")}
              placeholder="Your current password"
              className="input w-full"
            />
            {errors.password && (
              <p className="text-xs text-error-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Type <span className="font-mono text-red-600">DELETE</span> to confirm
            </label>
            <input
              type="text"
              {...register("confirmation")}
              placeholder="DELETE"
              className="input w-full font-mono"
            />
            {errors.confirmation && (
              <p className="text-xs text-error-500 mt-1">{errors.confirmation.message}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                reset();
              }}
              className="px-4 py-2.5 text-sm font-medium border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleting || confirmation !== "DELETE"}
              className="px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting..." : "Permanently Delete Account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
