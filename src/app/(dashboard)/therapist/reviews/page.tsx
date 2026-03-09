"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewClient {
  name: string;
  image: string | null;
}

interface ReviewBooking {
  bookingNumber: string;
  date: string;
  serviceType: string;
}

interface TherapistReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  therapistResponse: string | null;
  createdAt: string;
  client: ReviewClient;
  booking: ReviewBooking;
}

interface ReviewsResponse {
  reviews: TherapistReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
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

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];

export default function TherapistReviewsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sort, setSort] = useState("newest");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const queryKey = ["therapist-reviews", page, ratingFilter, sort];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<ReviewsResponse> => {
      const params = new URLSearchParams({ page: String(page), sort });
      if (ratingFilter) params.set("rating", String(ratingFilter));
      const res = await fetch(`/api/therapist/reviews?${params}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ reviewId, response }: { reviewId: string; response: string }) => {
      const res = await fetch(`/api/reviews/${reviewId}/respond`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to respond");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Response saved");
      setRespondingTo(null);
      setResponseText("");
      queryClient.invalidateQueries({ queryKey: ["therapist-reviews"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save response");
    },
  });

  const reviews = data?.reviews || [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Reviews</h1>
        <p className="text-neutral-500 mt-1">
          View and respond to client reviews.
        </p>
      </div>

      {/* Summary Card */}
      {summary && summary.totalReviews > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Average rating */}
            <div className="text-center sm:text-left flex-shrink-0">
              <div className="text-5xl font-bold text-neutral-900">
                {summary.averageRating.toFixed(1)}
              </div>
              <div className="flex gap-0.5 justify-center sm:justify-start mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={cn(
                      "w-5 h-5",
                      star <= Math.round(summary.averageRating) ? "text-amber-400" : "text-neutral-200"
                    )}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                {summary.totalReviews} review{summary.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.distribution[star] || 0;
                const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
                return (
                  <button
                    key={star}
                    onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                    className={cn(
                      "flex items-center gap-2 w-full group rounded px-1 py-0.5 transition-colors",
                      ratingFilter === star ? "bg-amber-50" : "hover:bg-neutral-50"
                    )}
                  >
                    <span className="text-sm text-neutral-600 w-6 text-right">{star}</span>
                    <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-500 w-8 text-right">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {ratingFilter && (
          <button
            onClick={() => {
              setRatingFilter(null);
              setPage(1);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-50 text-amber-700 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            {ratingFilter} star{ratingFilter !== 1 ? "s" : ""}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="ml-auto">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="input text-sm py-1.5 px-3"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
              <div className="flex items-start gap-3">
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
          <p className="text-neutral-500">
            {ratingFilter
              ? `No ${ratingFilter}-star reviews.`
              : "No reviews yet. Reviews will appear here as clients leave feedback."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                {review.client.image ? (
                  <Image
                    src={review.client.image}
                    alt={review.client.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                    <span className="text-sm font-semibold text-neutral-500">
                      {review.client.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-neutral-900">{review.client.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={cn(
                                "w-4 h-4",
                                star <= review.rating ? "text-amber-400" : "text-neutral-200"
                              )}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-neutral-400">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-neutral-400">
                        #{review.booking.bookingNumber}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatServiceType(review.booking.serviceType)} &middot; {formatDate(review.booking.date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review content */}
              {review.title && (
                <p className="font-semibold text-neutral-900">{review.title}</p>
              )}
              {review.comment && (
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {review.comment}
                </p>
              )}

              {/* Therapist Response */}
              {review.therapistResponse && respondingTo !== review.id && (
                <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider">
                      Your Response
                    </p>
                    <button
                      onClick={() => {
                        setRespondingTo(review.id);
                        setResponseText(review.therapistResponse || "");
                      }}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-neutral-700">{review.therapistResponse}</p>
                </div>
              )}

              {/* Respond form */}
              {respondingTo === review.id ? (
                <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
                  <label className="block text-sm font-medium text-neutral-700">
                    {review.therapistResponse ? "Edit Your Response" : "Write a Response"}
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Thank the client for their feedback..."
                    rows={3}
                    className="input w-full resize-none"
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-400">{responseText.length}/1000</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setRespondingTo(null);
                          setResponseText("");
                        }}
                        className="px-3 py-1.5 text-sm border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          respondMutation.mutate({
                            reviewId: review.id,
                            response: responseText.trim(),
                          })
                        }
                        disabled={!responseText.trim() || respondMutation.isPending}
                        className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {respondMutation.isPending ? "Saving..." : "Save Response"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                !review.therapistResponse && (
                  <button
                    onClick={() => setRespondingTo(review.id)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    Respond
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-neutral-500">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
