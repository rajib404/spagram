"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotificationPrefs {
  bookingConfirmations: boolean;
  bookingReminders: boolean;
  reviewRequests: boolean;
  marketing: boolean;
}

export function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    bookingConfirmations: true,
    bookingReminders: true,
    reviewRequests: true,
    marketing: false,
  });
  const [saving, setSaving] = useState(false);

  function toggle(key: keyof NotificationPrefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    // In a full implementation, this would save to the database
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Notification preferences saved");
    setSaving(false);
  }

  const items: { key: keyof NotificationPrefs; label: string; description: string }[] = [
    {
      key: "bookingConfirmations",
      label: "Booking Confirmations",
      description: "Receive emails when your booking is accepted, declined, or cancelled.",
    },
    {
      key: "bookingReminders",
      label: "Booking Reminders",
      description: "Get reminded 24 hours before your upcoming sessions.",
    },
    {
      key: "reviewRequests",
      label: "Review Requests",
      description: "Receive a reminder to review after a completed session.",
    },
    {
      key: "marketing",
      label: "Marketing & Promotions",
      description: "Special offers, new features, and recommendations.",
    },
  ];

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Email Notifications
        </h3>
        <p className="text-sm text-neutral-500">
          Choose which emails you&apos;d like to receive.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between gap-4 py-3 border-b border-neutral-100 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {item.label}
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">
                {item.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggle(item.key)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5",
                prefs[item.key] ? "bg-primary-600" : "bg-neutral-200"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                  prefs[item.key] ? "translate-x-[22px]" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Preferences"}
      </button>
    </div>
  );
}
