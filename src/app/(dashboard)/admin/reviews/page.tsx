"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVisible: boolean;
  therapistResponse: string | null;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  therapistName: string;
  bookingNumber: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (filter) params.set("filter", filter);
      const res = await fetch(`/api/admin/reviews?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReviews(data.reviews);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  async function handleToggleVisibility(reviewId: string, isVisible: boolean) {
    setActionId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible }),
      });
      if (!res.ok) throw new Error();
      toast.success(isVisible ? "Review made visible" : "Review hidden");
      fetchReviews();
    } catch {
      toast.error("Failed to update review");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Review Moderation</h1>
        <p className="text-neutral-500 mt-1">{total} total reviews</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search reviews..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input max-w-xs" />
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="input max-w-[180px]">
          <option value="">All reviews</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
          <option value="low-rating">Low rating (1-2)</option>
        </select>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 animate-pulse">
              <div className="h-4 bg-neutral-200 rounded w-48 mb-2" />
              <div className="h-3 bg-neutral-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center text-neutral-400">No reviews found</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className={cn("bg-white rounded-xl border p-5", r.isVisible ? "border-neutral-200" : "border-red-200 bg-red-50/30")}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className={cn("w-4 h-4", i < r.rating ? "text-amber-400 fill-current" : "text-neutral-200 fill-current")} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    {!r.isVisible && (
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Hidden</span>
                    )}
                  </div>

                  {r.title && <p className="font-medium text-neutral-900 mt-1">{r.title}</p>}
                  {r.comment && <p className="text-sm text-neutral-600 mt-1 line-clamp-3">{r.comment}</p>}

                  {r.therapistResponse && (
                    <div className="mt-2 pl-3 border-l-2 border-primary-200">
                      <p className="text-xs text-neutral-500">Therapist response:</p>
                      <p className="text-sm text-neutral-600">{r.therapistResponse}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                    <span>{r.clientName} ({r.clientEmail})</span>
                    <span>&rarr; {r.therapistName}</span>
                    <span>{r.bookingNumber}</span>
                    <span>{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleVisibility(r.id, !r.isVisible)}
                  disabled={actionId === r.id}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg flex-shrink-0 disabled:opacity-50 transition-colors",
                    r.isVisible
                      ? "border border-red-200 text-red-600 hover:bg-red-50"
                      : "bg-green-600 text-white hover:bg-green-700"
                  )}
                >
                  {r.isVisible ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="text-xs px-3 py-1.5 border border-neutral-200 rounded-md disabled:opacity-40">Prev</button>
            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="text-xs px-3 py-1.5 border border-neutral-200 rounded-md disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
