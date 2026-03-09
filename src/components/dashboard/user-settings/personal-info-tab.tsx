"use client";

import { useState } from "react";
import type { UserProfile } from "@/app/(dashboard)/user/settings/page";

interface Props {
  user: UserProfile;
  onSave: (data: { firstName: string; lastName: string; phone: string }) => Promise<void>;
}

export function PersonalInfoTab({ user, onSave }: Props) {
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ firstName, lastName, phone });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Personal Information
        </h3>
        <p className="text-sm text-neutral-500">
          Update your personal details.
        </p>
      </div>

      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={user.email}
          disabled
          className="input w-full bg-neutral-50 text-neutral-500 cursor-not-allowed"
        />
        <p className="text-xs text-neutral-400 mt-1">
          Email cannot be changed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Your first name"
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Your last name"
            className="input w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
          className="input w-full"
        />
      </div>

      {/* Member since */}
      <div className="pt-3 border-t border-neutral-100">
        <p className="text-xs text-neutral-400">
          Member since{" "}
          {new Date(user.createdAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
