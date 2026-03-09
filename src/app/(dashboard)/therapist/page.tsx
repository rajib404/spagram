"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UpcomingBooking {
  id: string;
  bookingNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  serviceType: string;
  locationType: string;
  status: string;
  totalPrice: string;
  clientName: string;
  clientImage: string | null;
  acceptRejectToken: string | null;
}

interface RecentReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  clientName: string;
  clientImage: string | null;
  therapistResponse: string | null;
}

interface DashboardStats {
  bookingsThisMonth: number;
  upcomingCount: number;
  averageRating: number;
  reviewCount: number;
  revenueThisMonth: string;
  profileCompletion: number;
  upcomingBookings: UpcomingBooking[];
  recentReviews: RecentReview[];
}

export default function TherapistDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/therapist/stats");
      if (!res.ok) throw new Error();
      setStats(await res.json());
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleRespond(bookingId: string, action: "accept" | "reject", token: string) {
    setRespondingTo(bookingId);
    try {
      const res = await fetch(`/api/bookings/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }

      toast.success(action === "accept" ? "Booking accepted" : "Booking declined");
      fetchStats();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRespondingTo(null);
    }
  }

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <div className="text-center py-16 text-neutral-500">
        Failed to load dashboard data.
      </div>
    );
  }

  const statCards = [
    {
      label: "Bookings This Month",
      value: stats.bookingsThisMonth,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      color: "text-primary-600 bg-primary-50",
    },
    {
      label: "Upcoming",
      value: stats.upcomingCount,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Avg Rating",
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—",
      sub: stats.reviewCount > 0 ? `${stats.reviewCount} reviews` : "",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Revenue This Month",
      value: `$${parseFloat(stats.revenueThisMonth).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-success-600 bg-success-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-neutral-500 mt-1">
          Here&apos;s what&apos;s happening with your practice.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-neutral-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={cn("p-2 rounded-lg", card.color)}>{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{card.label}</p>
            {card.sub && (
              <p className="text-xs text-neutral-400 mt-0.5">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Profile Completion */}
      {stats.profileCompletion < 100 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-neutral-900">
                Profile Completion
              </h3>
              <p className="text-sm text-neutral-500">
                Complete your profile to attract more clients
              </p>
            </div>
            <span className="text-lg font-bold text-primary-600">
              {stats.profileCompletion}%
            </span>
          </div>
          <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${stats.profileCompletion}%` }}
            />
          </div>
          <Link
            href="/therapist/profile"
            className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Complete your profile &rarr;
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">
              Upcoming Bookings
            </h2>
            <Link
              href="/therapist/bookings"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>

          {stats.upcomingBookings.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-sm">
              No upcoming bookings
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {stats.upcomingBookings.map((booking) => {
                const bookingDate = new Date(booking.date);
                const isPending = booking.status === "PENDING";

                return (
                  <div key={booking.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center text-sm font-semibold shrink-0">
                          {booking.clientName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 text-sm truncate">
                            {booking.clientName}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {bookingDate.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            &middot; {booking.startTime} &ndash;{" "}
                            {booking.endTime}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-neutral-400">
                              {booking.serviceType.replace(/_/g, " ")}
                            </span>
                            <span
                              className={cn(
                                "inline-flex text-[11px] font-medium px-1.5 py-0.5 rounded-full",
                                isPending
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-success-50 text-success-700"
                              )}
                            >
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900 whitespace-nowrap">
                        ${booking.totalPrice}
                      </span>
                    </div>

                    {isPending && booking.acceptRejectToken && (
                      <div className="flex gap-2 mt-3 ml-[52px]">
                        <button
                          onClick={() =>
                            handleRespond(
                              booking.id,
                              "accept",
                              booking.acceptRejectToken!
                            )
                          }
                          disabled={respondingTo === booking.id}
                          className="px-3 py-1.5 text-xs font-medium bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:opacity-50 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleRespond(
                              booking.id,
                              "reject",
                              booking.acceptRejectToken!
                            )
                          }
                          disabled={respondingTo === booking.id}
                          className="px-3 py-1.5 text-xs font-medium bg-error-600 text-white rounded-lg hover:bg-error-700 disabled:opacity-50 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Recent Reviews</h2>
            <Link
              href="/therapist/reviews"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>

          {stats.recentReviews.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-sm">
              No reviews yet
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {stats.recentReviews.map((review) => (
                <div key={review.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center text-sm font-semibold shrink-0">
                      {review.clientName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-neutral-900">
                          {review.clientName}
                        </p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg
                              key={i}
                              className={cn(
                                "w-3.5 h-3.5",
                                i < review.rating
                                  ? "text-amber-400 fill-current"
                                  : "text-neutral-200 fill-current"
                              )}
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      {review.title && (
                        <p className="text-sm font-medium text-neutral-700 mt-0.5">
                          {review.title}
                        </p>
                      )}
                      {review.comment && (
                        <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                          {review.comment}
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 mt-1">
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 bg-neutral-200 rounded w-64" />
        <div className="h-4 bg-neutral-100 rounded w-80 mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-neutral-200 p-5"
          >
            <div className="w-10 h-10 bg-neutral-100 rounded-lg mb-3" />
            <div className="h-7 bg-neutral-200 rounded w-16 mb-1" />
            <div className="h-4 bg-neutral-100 rounded w-24" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-neutral-200 h-72"
          />
        ))}
      </div>
    </div>
  );
}
