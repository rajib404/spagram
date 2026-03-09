"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminStats {
  totalUsers: number;
  totalTherapists: number;
  totalClients: number;
  pendingVerifications: number;
  totalBookings: number;
  bookingsThisMonth: number;
  totalRevenue: string;
  totalFeeIncome: string;
  recentBookings: {
    id: string;
    bookingNumber: string;
    status: string;
    totalPrice: string;
    createdAt: string;
    clientName: string;
    therapistName: string;
  }[];
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-green-50 text-green-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-neutral-100 text-neutral-500",
  REJECTED: "bg-red-50 text-red-600",
};

const ROLE_COLORS: Record<string, string> = {
  CLIENT: "bg-blue-50 text-blue-700",
  THERAPIST: "bg-purple-50 text-purple-700",
  ADMIN: "bg-red-50 text-red-700",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setStats)
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!stats) return <div className="text-center py-16 text-neutral-500">Failed to load dashboard data.</div>;

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, color: "text-primary-600 bg-primary-50", href: "/admin/users",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
      sub: `${stats.totalClients} clients, ${stats.totalTherapists} therapists` },
    { label: "Pending Verifications", value: stats.pendingVerifications, color: "text-amber-600 bg-amber-50", href: "/admin/therapists",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> },
    { label: "Total Bookings", value: stats.totalBookings, color: "text-blue-600 bg-blue-50", href: "/admin/bookings",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
      sub: `${stats.bookingsThisMonth} this month` },
    { label: "Platform Fee Income", value: `$${parseFloat(stats.totalFeeIncome).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, color: "text-success-600 bg-success-50", href: "/admin/revenue",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      sub: `$${parseFloat(stats.totalRevenue).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total revenue` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="text-neutral-500 mt-1">Platform overview and management.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-neutral-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className={cn("p-2 rounded-lg", card.color)}>{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{card.label}</p>
            {card.sub && <p className="text-xs text-neutral-400 mt-0.5">{card.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
          </div>
          {stats.recentBookings.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-sm">No bookings yet</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {stats.recentBookings.map((b) => (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{b.clientName} &rarr; {b.therapistName}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{b.bookingNumber} &middot; {new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-full", STATUS_COLORS[b.status] ?? "bg-neutral-100 text-neutral-500")}>{b.status}</span>
                    <span className="text-sm font-semibold text-neutral-900">${parseFloat(b.totalPrice).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Recent Registrations</h2>
            <Link href="/admin/users" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
          </div>
          {stats.recentUsers.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-sm">No users yet</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {stats.recentUsers.map((u) => (
                <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{u.name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-full", ROLE_COLORS[u.role] ?? "bg-neutral-100 text-neutral-500")}>{u.role}</span>
                    <span className="text-xs text-neutral-400">{new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
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
          <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5">
            <div className="w-10 h-10 bg-neutral-100 rounded-lg mb-3" />
            <div className="h-7 bg-neutral-200 rounded w-16 mb-1" />
            <div className="h-4 bg-neutral-100 rounded w-24" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-neutral-200 h-72" />
        ))}
      </div>
    </div>
  );
}
