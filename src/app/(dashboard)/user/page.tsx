"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

interface UpcomingBooking {
  id: string;
  bookingNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  serviceType: string;
  locationType: string;
  totalPrice: string;
  status: string;
  therapist: {
    displayName: string;
    slug: string;
    profilePhoto: string | null;
    city: string | null;
    state: string | null;
  };
}

interface RecentActivity {
  id: string;
  bookingNumber: string;
  status: string;
  updatedAt: string;
  therapistName: string;
  therapistSlug: string;
}

interface Stats {
  upcomingBookings: UpcomingBooking[];
  pendingCount: number;
  totalBookings: number;
  recentActivity: RecentActivity[];
}

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatServiceType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Declined",
};

export default function UserDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-64" />
        <div className="h-4 bg-neutral-100 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-neutral-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-neutral-500 mt-1">
          Here&apos;s what&apos;s happening with your bookings.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/user/bookings?tab=upcoming"
          className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.upcomingBookings.length || 0}
              </p>
              <p className="text-sm text-neutral-500">Upcoming</p>
            </div>
          </div>
        </Link>

        <Link
          href="/user/bookings?tab=pending"
          className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.pendingCount || 0}
              </p>
              <p className="text-sm text-neutral-500">Pending</p>
            </div>
          </div>
        </Link>

        <Link
          href="/user/bookings"
          className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {stats?.totalBookings || 0}
              </p>
              <p className="text-sm text-neutral-500">Total Bookings</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/therapists"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Browse Therapists
        </Link>
        <Link
          href="/user/favorites"
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          View Favorites
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Upcoming Bookings</h2>
            <Link
              href="/user/bookings"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>

          {!stats?.upcomingBookings.length ? (
            <div className="p-8 text-center">
              <p className="text-neutral-400 text-sm">No upcoming bookings</p>
              <Link
                href="/therapists"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
              >
                Book a session
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {stats.upcomingBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href="/user/bookings?tab=upcoming"
                  className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors"
                >
                  {booking.therapist.profilePhoto ? (
                    <Image
                      src={booking.therapist.profilePhoto}
                      alt={booking.therapist.displayName}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-700">
                        {booking.therapist.displayName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {booking.therapist.displayName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatDate(booking.date)} &middot;{" "}
                      {formatTime12(booking.startTime)} &middot;{" "}
                      {formatServiceType(booking.serviceType)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">
                    ${parseFloat(booking.totalPrice).toFixed(0)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="font-semibold text-neutral-900">Recent Activity</h2>
          </div>

          {!stats?.recentActivity.length ? (
            <div className="p-8 text-center">
              <p className="text-neutral-400 text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                    backgroundColor:
                      activity.status === "ACCEPTED" ? "#16a34a" :
                      activity.status === "PENDING" ? "#d97706" :
                      activity.status === "COMPLETED" ? "#2563eb" :
                      activity.status === "CANCELLED" ? "#9ca3af" :
                      activity.status === "REJECTED" ? "#dc2626" : "#9ca3af",
                  }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-700">
                      <span className="font-medium">{activity.bookingNumber}</span>
                      {" "}with{" "}
                      <Link
                        href={`/therapists/${activity.therapistSlug}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        {activity.therapistName}
                      </Link>
                      {" "}&mdash; {STATUS_LABELS[activity.status] || activity.status}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400 flex-shrink-0">
                    {timeAgo(activity.updatedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
