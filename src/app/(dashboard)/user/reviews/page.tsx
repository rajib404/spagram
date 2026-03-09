"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  bookingId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  therapistResponse: string | null;
  createdAt: string;
  booking: {
    bookingNumber: string;
    date: string;
    serviceType: string;
  };
  therapist: {
    displayName: string;
    slug: string;
    profilePhoto: string | null;
  };
}

function formatServiceType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UserReviewsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["user-reviews"],
    queryFn: async () => {
      const res = await fetch("/api/user/reviews");
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json() as Promise<{ reviews: Review[] }>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { reviewId: string; rating: number; title: string; comment: string }) => {
      const res = await fetch("/api/user/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update review");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Review updated");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["user-reviews"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await fetch("/api/user/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      if (!res.ok) throw new Error("Failed to delete review");
      return res.json();
    },
    onMutate: async (reviewId) => {
      await queryClient.cancelQueries({ queryKey: ["user-reviews"] });
      const previous = queryClient.getQueryData<{ reviews: Review[] }>(["user-reviews"]);
      queryClient.setQueryData<{ reviews: Review[] }>(["user-reviews"], (old) => {
        if (!old) return old;
        return { reviews: old.reviews.filter((r) => r.id !== reviewId) };
      });
      return { previous };
    },
    onSuccess: () => {
      toast.success("Review deleted");
      setDeleteConfirm(null);
    },
    onError: (_err, _id, context) => {
      toast.error("Failed to delete review");
      if (context?.previous) queryClient.setQueryData(["user-reviews"], context.previous);
    },
  });

  function startEdit(review: Review) {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditTitle(review.title || "");
    setEditComment(review.comment || "");
  }

  const reviews = data?.reviews || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Reviews</h1>
        <p className="text-neutral-500 mt-1">
          Reviews you&apos;ve left for therapists.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-neutral-200 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-neutral-200 rounded w-40" />
                  <div className="h-3 bg-neutral-100 rounded w-64" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <p className="text-neutral-500">You haven&apos;t left any reviews yet.</p>
          <Link
            href="/user/bookings?tab=past"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
          >
            Review a past booking
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl border border-neutral-200 p-5"
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <Link href={`/therapists/${review.therapist.slug}`} className="flex-shrink-0">
                  {review.therapist.profilePhoto ? (
                    <Image
                      src={review.therapist.profilePhoto}
                      alt={review.therapist.displayName}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-700">
                        {review.therapist.displayName.charAt(0)}
                      </span>
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/therapists/${review.therapist.slug}`}
                        className="font-semibold text-neutral-900 hover:text-primary-600 transition-colors"
                      >
                        {review.therapist.displayName}
                      </Link>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {review.booking.bookingNumber} &middot;{" "}
                        {formatDate(review.booking.date)} &middot;{" "}
                        {formatServiceType(review.booking.serviceType)}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-400 flex-shrink-0">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  {/* Editing mode */}
                  {editingId === review.id ? (
                    <div className="mt-3 space-y-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditRating(star)}
                          >
                            <svg
                              className={cn(
                                "w-6 h-6",
                                star <= editRating ? "text-amber-400" : "text-neutral-200"
                              )}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title (optional)"
                        className="input w-full text-sm"
                      />
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Your review..."
                        rows={3}
                        className="input w-full text-sm resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateMutation.mutate({
                              reviewId: review.id,
                              rating: editRating,
                              title: editTitle,
                              comment: editComment,
                            })
                          }
                          disabled={updateMutation.isPending}
                          className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                          {updateMutation.isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-sm border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <svg
                            key={i}
                            className={cn(
                              "w-4 h-4",
                              i < review.rating ? "text-amber-400" : "text-neutral-200"
                            )}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        {review.title && (
                          <span className="ml-1 text-sm font-medium text-neutral-700">
                            {review.title}
                          </span>
                        )}
                      </div>

                      {review.comment && (
                        <p className="text-sm text-neutral-600 mt-2">
                          {review.comment}
                        </p>
                      )}

                      {/* Therapist response */}
                      {review.therapistResponse && (
                        <div className="mt-3 bg-neutral-50 rounded-lg p-3 border-l-2 border-primary-400">
                          <p className="text-xs font-medium text-neutral-500 mb-1">
                            Response from {review.therapist.displayName}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {review.therapistResponse}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => startEdit(review)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Edit
                        </button>
                        {deleteConfirm === review.id ? (
                          <span className="flex items-center gap-2 text-sm">
                            <span className="text-red-600">Delete?</span>
                            <button
                              onClick={() => deleteMutation.mutate(review.id)}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 font-medium hover:text-red-700 disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-neutral-500 hover:text-neutral-700"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(review.id)}
                            className="text-sm text-red-500 hover:text-red-600 font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
