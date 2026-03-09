"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PersonalInfoTab } from "@/components/dashboard/user-settings/personal-info-tab";
import { ChangePasswordTab } from "@/components/dashboard/user-settings/change-password-tab";
import { NotificationsTab } from "@/components/dashboard/user-settings/notifications-tab";
import { DeleteAccountTab } from "@/components/dashboard/user-settings/delete-account-tab";
import { PaymentMethodsTab } from "@/components/dashboard/user-settings/payment-methods-tab";

const TABS = [
  { id: "personal", label: "Personal Info" },
  { id: "password", label: "Change Password" },
  { id: "notifications", label: "Notifications" },
  { id: "payment", label: "Payment Methods" },
  { id: "delete", label: "Delete Account" },
] as const;

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  image: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("personal");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data.user);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  async function handleSaveProfile(data: { firstName: string; lastName: string; phone: string }) {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save");
      setUser((prev) => (prev ? { ...prev, ...result.user } : prev));
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-48" />
        <div className="h-4 bg-neutral-100 rounded w-64" />
        <div className="h-64 bg-white rounded-xl border border-neutral-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Account Settings</h1>
        <p className="text-neutral-500 mt-1">
          Manage your personal information and preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-neutral-100 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700",
              tab.id === "delete" && activeTab === tab.id && "!text-red-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        {activeTab === "personal" && user && (
          <PersonalInfoTab user={user} onSave={handleSaveProfile} />
        )}
        {activeTab === "password" && <ChangePasswordTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "payment" && <PaymentMethodsTab />}
        {activeTab === "delete" && <DeleteAccountTab />}
      </div>
    </div>
  );
}
