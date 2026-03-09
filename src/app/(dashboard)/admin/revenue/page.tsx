"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MonthlyData {
  month: string;
  revenue: number;
  feeIncome: number;
  bookings: number;
}

interface RevenueData {
  monthlyData: MonthlyData[];
  statusBreakdown: Record<string, number>;
  topTherapists: { therapistName: string; revenue: number; bookings: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-400",
  ACCEPTED: "bg-green-400",
  COMPLETED: "bg-blue-400",
  CANCELLED: "bg-neutral-300",
  REJECTED: "bg-red-400",
  NO_SHOW: "bg-orange-400",
};

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/revenue")
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then(setData)
      .catch(() => toast.error("Failed to load revenue data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-48" />
        <div className="grid lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-xl border border-neutral-200 h-32" />)}
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 h-64" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-16 text-neutral-500">Failed to load revenue data.</div>;

  const totalRevenue = data.monthlyData.reduce((s, m) => s + m.revenue, 0);
  const totalFees = data.monthlyData.reduce((s, m) => s + m.feeIncome, 0);
  const totalBookings = data.monthlyData.reduce((s, m) => s + m.bookings, 0);
  const maxRevenue = Math.max(...data.monthlyData.map((m) => m.revenue), 1);

  const totalStatusBookings = Object.values(data.statusBreakdown).reduce((s, v) => s + v, 0) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Revenue Dashboard</h1>
        <p className="text-neutral-500 mt-1">Financial overview for the last 12 months.</p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">Total Revenue (12mo)</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">Platform Fee Income (12mo)</p>
          <p className="text-2xl font-bold text-success-600 mt-1">${totalFees.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">Total Bookings (12mo)</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{totalBookings}</p>
        </div>
      </div>

      {/* Revenue chart (bar chart) */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h2 className="font-semibold text-neutral-900 mb-4">Monthly Revenue</h2>
        <div className="flex items-end gap-1.5 h-48">
          {data.monthlyData.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-neutral-500 font-medium">${m.revenue > 0 ? (m.revenue / 1000).toFixed(m.revenue >= 1000 ? 0 : 1) + "k" : "0"}</span>
              <div className="w-full flex flex-col gap-0.5" style={{ height: `${Math.max((m.revenue / maxRevenue) * 100, 2)}%` }}>
                <div className="flex-1 bg-primary-500 rounded-t-sm min-h-[2px]" />
                {m.feeIncome > 0 && (
                  <div className="bg-success-400 rounded-b-sm" style={{ height: `${(m.feeIncome / m.revenue) * 100}%`, minHeight: "2px" }} />
                )}
              </div>
              <span className="text-[9px] text-neutral-400 whitespace-nowrap">{m.month.replace(" 20", "'")}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary-500 rounded-sm" /> Revenue</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-success-400 rounded-sm" /> Platform Fees</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="font-semibold text-neutral-900 mb-4">Booking Status Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(data.statusBreakdown).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-neutral-600">{status}</span>
                  <span className="text-neutral-900 font-medium">{count} ({((count / totalStatusBookings) * 100).toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", STATUS_COLORS[status] ?? "bg-neutral-300")} style={{ width: `${(count / totalStatusBookings) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top therapists */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="font-semibold text-neutral-900 mb-4">Top Therapists by Revenue</h2>
          {data.topTherapists.length === 0 ? (
            <p className="text-sm text-neutral-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.topTherapists.map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{t.therapistName}</p>
                      <p className="text-xs text-neutral-400">{t.bookings} bookings</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">${t.revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
