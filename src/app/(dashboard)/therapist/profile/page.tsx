"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BasicInfoTab } from "@/components/dashboard/profile/basic-info-tab";
import { PersonalDetailsTab } from "@/components/dashboard/profile/personal-details-tab";
import { PhotosTab } from "@/components/dashboard/profile/photos-tab";
import { LocationTab } from "@/components/dashboard/profile/location-tab";
import { ServicesTab } from "@/components/dashboard/profile/services-tab";
import { AccountTab } from "@/components/dashboard/profile/account-tab";

const TABS = [
  { id: "basic", label: "Basic Info", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
  { id: "personal", label: "Personal", icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z" },
  { id: "photos", label: "Photos", icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0020.25 4.5H3.75A2.25 2.25 0 001.5 6.75v12a2.25 2.25 0 002.25 2.25z" },
  { id: "location", label: "Location", icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" },
  { id: "services", label: "Services", icon: "M11.42 15.17l-5.1-3.398a.75.75 0 01-.062-1.224l9.474-7.11a.75.75 0 011.218.716l-2.34 8.19a.75.75 0 01-.558.516l-6.632 1.31z M17.94 11.57l2.55.847a.75.75 0 01.365 1.18l-5.28 6.337a.75.75 0 01-1.325-.477V15.04a.75.75 0 01.405-.665l3.285-1.805z" },
  { id: "account", label: "Account", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
] as const;

export interface ProfileData {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  tagline: string | null;
  profilePhoto: string | null;
  galleryPhotos: string[];
  gender: string | null;
  ethnicity: string | null;
  age: number | null;
  height: string | null;
  weight: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  state: string | null;
  city: string | null;
  borough: string | null;
  fullAddress: string | null;
  incallAvailable: boolean;
  outcallAvailable: boolean;
  incallAddress: string | null;
  outcallRadius: number | null;
  massageTypes: string[];
  incallPricePerHour: string | null;
  outcallPricePerHour: string | null;
}

export interface UserData {
  email: string;
  phone: string | null;
}

export default function ProfileSettingsPage() {
  const [activeTab, setActiveTab] = useState("basic");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/therapist/profile");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile(data.profile);
      setUserData(data.user);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSave(section: string, data: Record<string, unknown>) {
    try {
      const res = await fetch("/api/therapist/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, data }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to save");
      }

      toast.success("Changes saved");
      fetchProfile();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes");
      return false;
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-48" />
        <div className="h-12 bg-neutral-100 rounded" />
        <div className="h-96 bg-white rounded-xl border border-neutral-200" />
      </div>
    );
  }

  if (!profile || !userData) {
    return (
      <div className="text-center py-16 text-neutral-500">
        Failed to load profile data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Profile Settings
        </h1>
        <p className="text-neutral-500 mt-1">
          Manage your therapist profile and account settings.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200 overflow-x-auto">
        <nav className="flex gap-0 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              )}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={tab.icon}
                />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        {activeTab === "basic" && (
          <BasicInfoTab profile={profile} onSave={(d) => handleSave("basic", d)} />
        )}
        {activeTab === "personal" && (
          <PersonalDetailsTab profile={profile} onSave={(d) => handleSave("personal", d)} />
        )}
        {activeTab === "photos" && (
          <PhotosTab profile={profile} onSave={(d) => handleSave("photos", d)} />
        )}
        {activeTab === "location" && (
          <LocationTab profile={profile} onSave={(d) => handleSave("location", d)} />
        )}
        {activeTab === "services" && (
          <ServicesTab profile={profile} onSave={(d) => handleSave("services", d)} />
        )}
        {activeTab === "account" && (
          <AccountTab user={userData} onSave={(d) => handleSave("account", d)} />
        )}
      </div>
    </div>
  );
}
