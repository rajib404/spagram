"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UserBookingCard } from "@/components/dashboard/user-bookings/booking-card";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Pending" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export interface UserBooking {
  id: string;
  bookingNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  serviceType: string;
  locationType: string;
  outcallAddress: string | null;
  totalPrice: string;
  bookingFee: string;
  status: string;
  clientNotes: string | null;
  createdAt: string;
  therapist: {
    id: string;
    displayName: string;
    slug: string;
    profilePhoto: string | null;
    city: string | null;
    state: string | null;
  };
  review: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
  } | null;
}

interface BookingsResponse {
  bookings: UserBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UserBookingsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-40" />
        <div className="h-10 bg-neutral-100 rounded-lg" />
        <div className="h-64 bg-white rounded-xl border border-neutral-200" />
      </div>
    }>
      <UserBookingsContent />
    </Suspense>
  );
}

function UserBookingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "upcoming";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const queryKey = ["user-bookings", activeTab, search, page];

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: async (): Promise<BookingsResponse> => {
      const params = new URLSearchParams({ tab: activeTab, page: String(page) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/user/bookings?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to cancel");
      }
      return res.json();
    },
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BookingsResponse>(queryKey);
      queryClient.setQueryData<BookingsResponse>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          bookings: old.bookings.filter((b) => b.id !== bookingId),
          pagination: { ...old.pagination, total: old.pagination.total - 1 },
        };
      });
      return { previous };
    },
    onSuccess: (d) => {
      toast.success(`Booking ${d.bookingNumber} cancelled`);
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
    },
    onError: (err, _id, context) => {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setPage(1);
  }

  const bookings = data?.bookings || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Bookings</h1>
        <p className="text-neutral-500 mt-1">
          Track and manage all your massage bookings.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === tab.key
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            {tab.label}
            {data && tab.key === activeTab && pagination && (
              <span className="ml-1.5 text-xs bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded-full">
                {pagination.total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search by therapist name or booking #..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input pl-10 w-full"
        />
      </div>

      {/* Loading */}
      {isFetching && !isLoading && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-neutral-200 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-neutral-200 rounded w-48" />
                  <div className="h-3 bg-neutral-100 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
          <p className="text-neutral-500">
            {search ? "No bookings match your search." : `No ${activeTab} bookings.`}
          </p>
          {activeTab === "upcoming" && !search && (
            <a href="/therapists" className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
              Browse therapists to book a session
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <UserBookingCard
              key={booking.id}
              booking={booking}
              tab={activeTab}
              onCancel={(id) => cancelMutation.mutate(id)}
              actionDisabled={cancelMutation.isPending}
            />
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
