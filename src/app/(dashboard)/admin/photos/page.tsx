"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";

interface Therapist {
  id: string;
  displayName: string;
  slug: string;
  profilePhoto: string | null;
  galleryPhotos: string[];
  state: string | null;
  city: string | null;
}

type Filter = "all" | "no-photos" | "profile-only" | "complete";

async function uploadFiles(files: File[]): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Upload failed (${res.status})`);
  }
  return (await res.json()).urls;
}

async function fetchFromUrls(urls: string[]): Promise<{ urls: string[]; errors: string[] }> {
  const res = await fetch("/api/admin/fetch-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Fetch failed (${res.status})`);
  }
  return res.json();
}

async function savePhotos(
  id: string,
  data: { profilePhoto?: string | null; galleryPhotos?: string[] }
) {
  const res = await fetch(`/api/admin/therapists/${id}/photos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => null);
    throw new Error(d?.error || `Save failed (${res.status})`);
  }
  return res.json();
}

export default function AdminPhotosPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTherapists = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), search: s, filter: "active" });
      const res = await fetch(`/api/admin/therapists?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTherapists(data.therapists);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load therapists");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTherapists(page, search);
  }, [page, search, fetchTherapists]);

  // Apply client-side filter
  const filtered = therapists.filter((t) => {
    const hasProfile = !!t.profilePhoto;
    const hasGallery = (t.galleryPhotos?.length || 0) > 0;
    switch (filter) {
      case "no-photos":
        return !hasProfile && !hasGallery;
      case "profile-only":
        return hasProfile && !hasGallery;
      case "complete":
        return hasProfile && hasGallery;
      default:
        return true;
    }
  });

  const withPhotos = therapists.filter(
    (t) => t.profilePhoto || (t.galleryPhotos?.length || 0) > 0
  ).length;

  function updateTherapist(id: string, updates: Partial<Therapist>) {
    setTherapists((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Bulk Photo Manager</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Upload and manage photos for all therapists in one place.
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">
            Photo coverage
          </span>
          <span className="text-sm text-neutral-500">
            {withPhotos}/{therapists.length} therapists have photos
            {total > therapists.length && ` (showing page ${page} of ${totalPages})`}
          </span>
        </div>
        <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{
              width: therapists.length
                ? `${(withPhotos / therapists.length) * 100}%`
                : "0%",
            }}
          />
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <div className="flex gap-1.5">
          {(
            [
              ["all", "All"],
              ["no-photos", "No Photos"],
              ["profile-only", "Profile Only"],
              ["complete", "Complete"],
            ] as [Filter, string][]
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                filter === val
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Therapist list */}
      {loading ? (
        <div className="text-center py-12 text-neutral-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          No therapists match the current filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TherapistRow
              key={t.id}
              therapist={t}
              expanded={expandedId === t.id}
              onToggle={() =>
                setExpandedId(expandedId === t.id ? null : t.id)
              }
              onUpdate={(updates) => updateTherapist(t.id, updates)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg disabled:opacity-40 hover:bg-neutral-50"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg disabled:opacity-40 hover:bg-neutral-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Therapist Row ──────────────────────────────────────────────── */

function TherapistRow({
  therapist,
  expanded,
  onToggle,
  onUpdate,
}: {
  therapist: Therapist;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Therapist>) => void;
}) {
  const hasProfile = !!therapist.profilePhoto;
  const galleryCount = therapist.galleryPhotos?.length || 0;
  const hasAny = hasProfile || galleryCount > 0;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Collapsed row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
      >
        {/* Status dot */}
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            hasProfile && galleryCount > 0
              ? "bg-emerald-500"
              : hasAny
              ? "bg-amber-400"
              : "bg-red-400"
          }`}
        />

        {/* Mini avatar */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
          {therapist.profilePhoto ? (
            <Image
              src={therapist.profilePhoto}
              alt=""
              width={40}
              height={40}
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          )}
        </div>

        {/* Name & location */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">
            {therapist.displayName}
          </p>
          <p className="text-xs text-neutral-400 truncate">
            {[therapist.city, therapist.state].filter(Boolean).join(", ") ||
              therapist.slug}
          </p>
        </div>

        {/* Photo count badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              hasProfile
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {hasProfile ? "Profile" : "No profile"}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              galleryCount > 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-neutral-100 text-neutral-500"
            }`}
          >
            {galleryCount}/8 gallery
          </span>
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Expanded editor */}
      {expanded && (
        <InlinePhotoEditor therapist={therapist} onUpdate={onUpdate} />
      )}
    </div>
  );
}

/* ─── Inline Photo Editor ────────────────────────────────────────── */

function InlinePhotoEditor({
  therapist,
  onUpdate,
}: {
  therapist: Therapist;
  onUpdate: (updates: Partial<Therapist>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const [galleryUrl, setGalleryUrl] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const galleryPhotos = therapist.galleryPhotos || [];
  const busy = uploading || fetching;

  async function handleProfileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4MB");
      return;
    }
    setUploading(true);
    try {
      const urls = await uploadFiles([file]);
      const url = urls[0];
      await savePhotos(therapist.id, { profilePhoto: url });
      onUpdate({ profilePhoto: url });
      toast.success(`Profile photo saved for ${therapist.displayName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
    if (profileInputRef.current) profileInputRef.current.value = "";
  }

  async function handleRemoveProfile() {
    try {
      await savePhotos(therapist.id, { profilePhoto: null });
      onUpdate({ profilePhoto: null });
      toast.success("Profile photo removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  async function handleProfileFetchUrl() {
    const url = profileUrl.trim();
    if (!url) return;
    setFetching(true);
    try {
      const result = await fetchFromUrls([url]);
      if (result.errors.length > 0) {
        toast.error(result.errors[0]);
      }
      if (result.urls.length > 0) {
        await savePhotos(therapist.id, { profilePhoto: result.urls[0] });
        onUpdate({ profilePhoto: result.urls[0] });
        setProfileUrl("");
        toast.success(`Profile photo fetched for ${therapist.displayName}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fetch failed");
    }
    setFetching(false);
  }

  async function handleGalleryFetchUrl() {
    const rawUrls = galleryUrl
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    if (rawUrls.length === 0) return;

    const remaining = 8 - galleryPhotos.length;
    if (rawUrls.length > remaining) {
      toast.error(`Can only add ${remaining} more photo${remaining !== 1 ? "s" : ""}`);
      return;
    }

    setFetching(true);
    try {
      const result = await fetchFromUrls(rawUrls);
      if (result.errors.length > 0) {
        result.errors.forEach((e) => toast.error(e));
      }
      if (result.urls.length > 0) {
        const updated = [...galleryPhotos, ...result.urls];
        await savePhotos(therapist.id, { galleryPhotos: updated });
        onUpdate({ galleryPhotos: updated });
        setGalleryUrl("");
        toast.success(`${result.urls.length} photo${result.urls.length !== 1 ? "s" : ""} fetched`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fetch failed");
    }
    setFetching(false);
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 8 - galleryPhotos.length;
    if (files.length > remaining) {
      toast.error(`Can only add ${remaining} more photo${remaining !== 1 ? "s" : ""}`);
      return;
    }

    const valid = files.filter((f) => {
      if (f.size > 4 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 4MB`);
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;

    setUploading(true);
    try {
      const urls = await uploadFiles(valid);
      const updated = [...galleryPhotos, ...urls];
      await savePhotos(therapist.id, { galleryPhotos: updated });
      onUpdate({ galleryPhotos: updated });
      toast.success(`${urls.length} photo${urls.length !== 1 ? "s" : ""} added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  async function handleRemoveGallery(index: number) {
    const updated = galleryPhotos.filter((_, i) => i !== index);
    try {
      await savePhotos(therapist.id, { galleryPhotos: updated });
      onUpdate({ galleryPhotos: updated });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  async function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...galleryPhotos];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setDragIndex(null);
    setDragOverIndex(null);
    try {
      await savePhotos(therapist.id, { galleryPhotos: updated });
      onUpdate({ galleryPhotos: updated });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reorder failed");
    }
  }

  return (
    <div className="border-t border-neutral-100 px-4 py-5 bg-neutral-50/50">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Profile photo */}
        <div className="shrink-0">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Profile Photo
          </p>
          <div className="relative w-28 h-36 rounded-lg overflow-hidden bg-neutral-100 border-2 border-dashed border-neutral-300">
            {therapist.profilePhoto ? (
              <>
                <Image
                  src={therapist.profilePhoto}
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  onClick={handleRemoveProfile}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-black/70"
                >
                  &times;
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0020.25 4.5H3.75A2.25 2.25 0 001.5 6.75v12a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            )}
          </div>
          <input
            ref={profileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileUpload}
          />
          <button
            onClick={() => profileInputRef.current?.click()}
            disabled={busy}
            className="mt-2 w-28 text-center px-2 py-1.5 text-xs font-medium border border-neutral-300 rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
          >
            {busy ? "Working..." : "Upload"}
          </button>
          <div className="mt-2 w-28">
            <input
              type="text"
              placeholder="Paste URL..."
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleProfileFetchUrl()}
              className="w-full px-2 py-1.5 text-[10px] border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            {profileUrl.trim() && (
              <button
                onClick={handleProfileFetchUrl}
                disabled={busy}
                className="mt-1 w-full text-center px-2 py-1 text-[10px] font-medium bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors"
              >
                {fetching ? "Fetching..." : "Fetch"}
              </button>
            )}
          </div>
        </div>

        {/* Gallery photos */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Gallery ({galleryPhotos.length}/8)
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {galleryPhotos.map((photo, index) => (
              <div
                key={`${photo}-${index}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(index);
                }}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                className={`relative aspect-[4/5] rounded-lg overflow-hidden bg-neutral-100 cursor-grab active:cursor-grabbing group
                  ${dragOverIndex === index ? "ring-2 ring-primary-400" : ""}
                  ${dragIndex === index ? "opacity-50" : ""}
                `}
              >
                <Image
                  src={photo}
                  alt={`Gallery ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  onClick={() => handleRemoveGallery(index)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity"
                >
                  &times;
                </button>
                <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] font-medium px-1 py-0.5 rounded">
                  {index + 1}
                </span>
              </div>
            ))}

            {galleryPhotos.length < 8 && (
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={busy}
                className="aspect-[4/5] rounded-lg border-2 border-dashed border-neutral-300 hover:border-primary-400 hover:bg-primary-50/50 transition-colors flex flex-col items-center justify-center text-neutral-400 hover:text-primary-500 disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-[10px] font-medium mt-0.5">Add</span>
              </button>
            )}
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleGalleryUpload}
          />
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Paste image URL(s) — separate multiple with commas or new lines..."
              value={galleryUrl}
              onChange={(e) => setGalleryUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGalleryFetchUrl()}
              className="flex-1 px-2.5 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            <button
              onClick={handleGalleryFetchUrl}
              disabled={busy || !galleryUrl.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {fetching ? "Fetching..." : "Fetch URL"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
