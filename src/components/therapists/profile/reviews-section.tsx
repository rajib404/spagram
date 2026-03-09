"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/therapists/pagination";

interface ReviewData {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  therapistResponse: string | null;
  createdAt: string;
  client: {
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  };
}

interface ReviewsSectionProps {
  therapistProfileId: string;
  rating: number;
  reviewCount: number;
}

export function ReviewsSection({
  therapistProfileId,
  rating,
  reviewCount,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [total, setTotal] = useState(reviewCount);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [distribution, setDistribution] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/therapists/${therapistProfileId}/reviews?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || []);
        setTotal(d.total || 0);
        setTotalPages(d.totalPages || 1);
        if (d.distribution) setDistribution(d.distribution);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [therapistProfileId, page]);

  if (reviewCount === 0) {
    return (
      <section id="reviews">
        <h2 className="text-xl font-semibold text-neutral-900">Reviews</h2>
        <div className="mt-4 flex flex-col items-center rounded-xl border-2 border-dashed border-neutral-200 py-12">
          <MessageSquare className="h-10 w-10 text-neutral-300" />
          <p className="mt-3 text-sm text-neutral-500">No reviews yet</p>
        </div>
      </section>
    );
  }

  return (
    <section id="reviews">
      <h2 className="text-xl font-semibold text-neutral-900">Reviews</h2>

      {/* Summary */}
      <div className="mt-4 flex flex-col gap-6 rounded-xl border border-neutral-200 bg-white p-5 sm:flex-row sm:items-center">
        {/* Average rating */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl font-bold text-neutral-900">
            {rating.toFixed(1)}
          </span>
          <StarRating rating={rating} size="md" />
          <span className="mt-0.5 text-xs text-neutral-500">
            {total} review{total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const percent = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right font-medium text-neutral-600">
                  {star}
                </span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-8 text-right text-neutral-400">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review list */}
      {isLoading ? (
        <div className="mt-6 flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: ReviewData }) {
  const clientName = review.client.firstName
    ? `${review.client.firstName} ${review.client.lastName?.charAt(0) || ""}.`
    : "Anonymous";

  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
            {review.client.firstName?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">{clientName}</p>
            <p className="text-xs text-neutral-400">{date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {review.title && (
        <h4 className="mt-3 text-sm font-semibold text-neutral-800">
          {review.title}
        </h4>
      )}

      {review.comment && (
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
          {review.comment}
        </p>
      )}

      {/* Therapist response */}
      {review.therapistResponse && (
        <div className="mt-3 rounded-lg border-l-2 border-primary-300 bg-primary-50/50 py-2 pl-3 pr-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-primary-600">
            Therapist response
          </p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600">
            {review.therapistResponse}
          </p>
        </div>
      )}
    </div>
  );
}

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        return (
          <Star
            key={star}
            className={cn(
              sizeClass,
              filled
                ? "fill-amber-400 text-amber-400"
                : half
                  ? "fill-amber-400/50 text-amber-400"
                  : "fill-neutral-200 text-neutral-200"
            )}
          />
        );
      })}
    </div>
  );
}
