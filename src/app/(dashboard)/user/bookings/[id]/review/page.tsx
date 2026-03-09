"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface BookingForReview {
  id: string;
  bookingNumber: string;
  date: string;
  serviceType: string;
  status: string;
  therapist: {
    displayName: string;
    slug: string;
    profilePhoto: string | null;
  };
  hasReview: boolean;
}

function formatServiceType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function LeaveReviewPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ["booking-for-review", bookingId],
    queryFn: async (): Promise<BookingForReview> => {
      const res = await fetch(`/api/user/bookings/${bookingId}/review-info`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load booking");
      }
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit review");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Review submitted! Thank you for your feedback.");
      router.push("/user/bookings?tab=past");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    },
  });

  const commentValid = !comment.trim() || comment.trim().length >= 20;
  const canSubmit = rating >= 1 && commentValid && !submitMutation.isPending;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-48" />
        <div className="h-64 bg-white rounded-xl border border-neutral-200" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-neutral-700 font-medium mb-1">Unable to load booking</p>
          <p className="text-sm text-neutral-500 mb-4">
            {error instanceof Error ? error.message : "This booking may not exist or is not eligible for review."}
          </p>
          <Link
            href="/user/bookings?tab=past"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  if (booking.status !== "COMPLETED") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <p className="text-neutral-700 font-medium mb-1">Review not available</p>
          <p className="text-sm text-neutral-500 mb-4">
            You can only review completed bookings.
          </p>
          <Link href="/user/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  if (booking.hasReview) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-green-300 mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
          </svg>
          <p className="text-neutral-700 font-medium mb-1">Already reviewed</p>
          <p className="text-sm text-neutral-500 mb-4">
            You have already submitted a review for this booking.
          </p>
          <Link href="/user/reviews" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View My Reviews
          </Link>
        </div>
      </div>
    );
  }

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/user/bookings?tab=past"
          className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1 mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Bookings
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Leave a Review</h1>
        <p className="text-neutral-500 mt-1">
          Share your experience to help other clients and the therapist.
        </p>
      </div>

      {/* Booking info card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <div className="flex items-center gap-4">
          <Link href={`/therapists/${booking.therapist.slug}`} className="flex-shrink-0">
            {booking.therapist.profilePhoto ? (
              <Image
                src={booking.therapist.profilePhoto}
                alt={booking.therapist.displayName}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary-700">
                  {booking.therapist.displayName.charAt(0)}
                </span>
              </div>
            )}
          </Link>
          <div>
            <Link
              href={`/therapists/${booking.therapist.slug}`}
              className="font-semibold text-neutral-900 hover:text-primary-600 transition-colors"
            >
              {booking.therapist.displayName}
            </Link>
            <p className="text-sm text-neutral-500">
              {formatServiceType(booking.serviceType)} &middot; {formatDate(booking.date)}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Booking #{booking.bookingNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Review form or preview */}
      {!showPreview ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              How would you rate your experience?
            </label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-0.5 focus:outline-none"
                  >
                    <svg
                      className={cn(
                        "w-10 h-10 transition-colors",
                        star <= (hoveredRating || rating)
                          ? "text-amber-400"
                          : "text-neutral-200 hover:text-amber-200"
                      )}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
              {(hoveredRating || rating) > 0 && (
                <span className="text-sm font-medium text-neutral-600 ml-2">
                  {ratingLabels[hoveredRating || rating]}
                </span>
              )}
            </div>
            {rating === 0 && (
              <p className="text-xs text-neutral-400 mt-2">Click a star to rate</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Title <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience in a few words"
              className="input w-full"
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Your Review <span className="text-neutral-400 font-normal">(optional, min 20 characters)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience — what went well, how was the atmosphere, would you recommend this therapist?"
              rows={5}
              className="input w-full resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between mt-1">
              {comment.trim().length > 0 && comment.trim().length < 20 ? (
                <p className="text-xs text-red-500">
                  {20 - comment.trim().length} more characters needed
                </p>
              ) : (
                <span />
              )}
              <p className="text-xs text-neutral-400">
                {comment.length}/1000
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/user/bookings?tab=past"
              className="px-5 py-2.5 text-sm font-medium border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              disabled={!canSubmit}
              className="px-5 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              Preview Review
            </button>
          </div>
        </div>
      ) : (
        /* Preview */
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-3">
            <p className="text-sm font-medium text-neutral-600">Review Preview</p>
          </div>
          <div className="p-6 space-y-4">
            {/* Stars */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={cn(
                      "w-5 h-5",
                      star <= rating ? "text-amber-400" : "text-neutral-200"
                    )}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-medium text-neutral-600">
                {ratingLabels[rating]}
              </span>
            </div>

            {/* Title */}
            {title.trim() && (
              <h3 className="font-semibold text-neutral-900">{title.trim()}</h3>
            )}

            {/* Comment */}
            {comment.trim() && (
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {comment.trim()}
              </p>
            )}

            {!title.trim() && !comment.trim() && (
              <p className="text-sm text-neutral-400 italic">Rating only — no written review</p>
            )}
          </div>

          <div className="border-t border-neutral-200 px-6 py-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="px-5 py-2.5 text-sm font-medium border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Edit Review
            </button>
            <button
              type="button"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="px-5 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
