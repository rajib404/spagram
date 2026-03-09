"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoGalleryProps {
  profilePhoto: string | null;
  galleryPhotos: string[];
  displayName: string;
}

export function PhotoGallery({
  profilePhoto,
  galleryPhotos,
  displayName,
}: PhotoGalleryProps) {
  const allPhotos = [profilePhoto, ...galleryPhotos].filter(Boolean) as string[];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (allPhotos.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200">
        <span className="text-7xl font-bold text-primary-300">
          {displayName.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Main photo */}
      <div
        className="group relative cursor-pointer overflow-hidden rounded-2xl"
        onClick={() => setLightboxOpen(true)}
      >
        <div className="relative aspect-[4/5]">
          <Image
            src={allPhotos[selectedIndex]}
            alt={displayName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 400px"
            priority
          />
        </div>
        {allPhotos.length > 1 && (
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
            <span className="mb-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-700">
              View all photos
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allPhotos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {allPhotos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-all",
                i === selectedIndex
                  ? "ring-2 ring-primary-500 ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={photo}
                alt={`${displayName} photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>

          {allPhotos.length > 1 && (
            <>
              <button
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(
                    (selectedIndex - 1 + allPhotos.length) % allPhotos.length
                  );
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                className="absolute right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((selectedIndex + 1) % allPhotos.length);
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div
            className="relative max-h-[85vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={allPhotos[selectedIndex]}
              alt={displayName}
              width={800}
              height={1000}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
          </div>

          {/* Dots */}
          {allPhotos.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {allPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(i);
                  }}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    i === selectedIndex
                      ? "w-6 bg-white"
                      : "bg-white/40 hover:bg-white/60"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
