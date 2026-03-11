"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import type { ProfileData } from "@/app/(dashboard)/therapist/profile/page";

async function uploadToLocal(files: File[]): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("file", file);
  }
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Upload failed");
  }
  const data = await res.json();
  return data.urls;
}

interface Props {
  profile: ProfileData;
  onSave: (data: Record<string, unknown>) => Promise<boolean>;
}

export function PhotosTab({ profile, onSave }: Props) {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(profile.profilePhoto);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(profile.galleryPhotos || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function handleProfilePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4MB");
      return;
    }

    setUploading(true);
    try {
      const urls = await uploadToLocal([file]);
      const url = urls[0];
      if (url) {
        setProfilePhoto(url);
        toast.success("Profile photo updated. Click Save to confirm.");
      } else {
        toast.error("Upload failed — no URL returned");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
    }
    setUploading(false);
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 8 - galleryPhotos.length;
    if (files.length > remaining) {
      toast.error(`You can only add ${remaining} more photo${remaining !== 1 ? "s" : ""}`);
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > 4 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 4MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const urls = await uploadToLocal(validFiles);
      if (urls.length > 0) {
        setGalleryPhotos((prev) => [...prev, ...urls]);
        toast.success(`${urls.length} photo${urls.length !== 1 ? "s" : ""} added. Click Save to confirm.`);
      } else {
        toast.error("Upload failed — no URLs returned");
      }
    } catch (err) {
      console.error("Gallery upload error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload photos");
    }
    setUploading(false);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  function handleRemoveGallery(index: number) {
    setGalleryPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    setGalleryPhotos((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });

    setDragIndex(null);
    setDragOverIndex(null);
  }

  async function handleSave() {
    setSaving(true);
    await onSave({ profilePhoto, galleryPhotos });
    setSaving(false);
  }

  const hasChanges =
    profilePhoto !== profile.profilePhoto ||
    JSON.stringify(galleryPhotos) !== JSON.stringify(profile.galleryPhotos || []);

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Photo */}
      <div>
        <h3 className="font-semibold text-neutral-900 mb-1">Profile Photo</h3>
        <p className="text-sm text-neutral-500 mb-4">
          This is the main photo clients will see. Recommended: 400x500px.
        </p>
        <div className="flex items-start gap-6">
          <div className="relative w-32 h-40 rounded-xl overflow-hidden bg-neutral-100 border-2 border-dashed border-neutral-300 shrink-0">
            {profilePhoto ? (
              <>
                <Image
                  src={profilePhoto}
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => setProfilePhoto(null)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70"
                >
                  &times;
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-400">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0020.25 4.5H3.75A2.25 2.25 0 001.5 6.75v12a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePhotoChange}
            />
            <button
              type="button"
              onClick={() => profileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
            <p className="text-xs text-neutral-400 mt-2">JPG, PNG. Max 4MB.</p>
          </div>
        </div>
      </div>

      {/* Gallery Photos */}
      <div>
        <h3 className="font-semibold text-neutral-900 mb-1">Gallery Photos</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Add up to 8 photos. Drag to reorder. The first photo will be featured.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {galleryPhotos.map((photo, index) => (
            <div
              key={`${photo}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
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
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                type="button"
                onClick={() => handleRemoveGallery(index)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity"
              >
                &times;
              </button>
              <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                {index + 1}
              </span>
            </div>
          ))}

          {galleryPhotos.length < 8 && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading}
              className="aspect-[4/5] rounded-lg border-2 border-dashed border-neutral-300 hover:border-primary-400 hover:bg-primary-50/50 transition-colors flex flex-col items-center justify-center text-neutral-400 hover:text-primary-500 disabled:opacity-50"
            >
              <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-xs font-medium">Add Photos</span>
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

        <p className="text-xs text-neutral-400 mt-3">
          {galleryPhotos.length}/8 photos &middot; JPG, PNG &middot; Max 4MB each
        </p>
      </div>

      <div className="pt-4 border-t border-neutral-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="btn-primary px-6 py-2.5 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
