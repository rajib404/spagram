"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TherapistRow {
  id: string;
  displayName: string;
  slug: string;
  profilePhoto: string | null;
  state: string | null;
  city: string | null;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  massageTypes: string[];
  createdAt: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  bookingCount: number;
}

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<TherapistRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchTherapists = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (filter) params.set("filter", filter);
      const res = await fetch(`/api/admin/therapists?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTherapists(data.therapists);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load therapists");
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => { fetchTherapists(); }, [fetchTherapists]);

  async function handleAction(therapistId: string, data: Record<string, boolean>) {
    setActionId(therapistId);
    try {
      const res = await fetch(`/api/admin/therapists/${therapistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Therapist updated");
      fetchTherapists();
    } catch {
      toast.error("Failed to update therapist");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Therapist Management</h1>
        <p className="text-neutral-500 mt-1">{total} total therapist profiles</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input max-w-xs"
        />
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="input max-w-[180px]">
          <option value="">All therapists</option>
          <option value="pending">Pending verification</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-32" />
                  <div className="h-3 bg-neutral-100 rounded w-24" />
                </div>
              </div>
              <div className="h-3 bg-neutral-100 rounded w-full mt-2" />
            </div>
          ))}
        </div>
      ) : therapists.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center text-neutral-400">No therapists found</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {therapists.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-start gap-3">
                {t.profilePhoto ? (
                  <Image src={t.profilePhoto} alt={t.displayName} width={48} height={48} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-700">{t.displayName.charAt(0)}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-neutral-900 truncate">{t.displayName}</h3>
                  <p className="text-xs text-neutral-400 truncate">{t.userEmail}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-full",
                      t.isVerified ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {t.isVerified ? "Verified" : "Unverified"}
                    </span>
                    <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-full",
                      t.isActive ? "bg-blue-50 text-blue-700" : "bg-neutral-100 text-neutral-500"
                    )}>
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500 space-y-1">
                <p>{[t.city, t.state].filter(Boolean).join(", ") || "No location"} &middot; {t.bookingCount} bookings &middot; {t.reviewCount} reviews</p>
                {t.rating > 0 && <p>Rating: {t.rating.toFixed(1)}/5</p>}
                <p className="text-neutral-400">Joined {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-2">
                {!t.isVerified && (
                  <button
                    onClick={() => handleAction(t.id, { isVerified: true })}
                    disabled={actionId === t.id}
                    className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Approve
                  </button>
                )}
                {t.isVerified && (
                  <button
                    onClick={() => handleAction(t.id, { isVerified: false })}
                    disabled={actionId === t.id}
                    className="px-3 py-1.5 text-xs font-medium border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50 transition-colors"
                  >
                    Revoke Verification
                  </button>
                )}
                <button
                  onClick={() => handleAction(t.id, { isActive: !t.isActive })}
                  disabled={actionId === t.id}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50 transition-colors",
                    t.isActive
                      ? "border border-red-200 text-red-600 hover:bg-red-50"
                      : "border border-green-200 text-green-600 hover:bg-green-50"
                  )}
                >
                  {t.isActive ? "Deactivate" : "Activate"}
                </button>
                <a
                  href={`/therapists/${t.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  View Profile
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
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
