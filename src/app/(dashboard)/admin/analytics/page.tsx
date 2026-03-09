"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  registrations: { month: string; clients: number; therapists: number; total: number }[];
  bookingsOverTime: { month: string; count: number }[];
  popularServices: { serviceType: string; count: number }[];
  popularLocations: { state: string; count: number }[];
  conversionRates: {
    total: number;
    completed: number;
    accepted: number;
    cancelled: number;
    rejected: number;
    completionRate: string;
    acceptanceRate: string;
  };
}

function formatServiceType(type: string): string {
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then(setData)
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-48" />
        <div className="grid lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-xl border border-neutral-200 h-64" />)}
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-16 text-neutral-500">Failed to load analytics.</div>;

  const maxReg = Math.max(...data.registrations.map((r) => r.total), 1);
  const maxBookings = Math.max(...data.bookingsOverTime.map((b) => b.count), 1);
  const maxService = Math.max(...data.popularServices.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Analytics</h1>
        <p className="text-neutral-500 mt-1">Platform metrics and trends over the last 12 months.</p>
      </div>

      {/* Conversion funnel */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h2 className="font-semibold text-neutral-900 mb-4">Booking Funnel</h2>
        <div className="grid sm:grid-cols-5 gap-4">
          {[
            { label: "Total", value: data.conversionRates.total, color: "bg-neutral-100 text-neutral-700" },
            { label: "Accepted", value: data.conversionRates.accepted, color: "bg-green-50 text-green-700" },
            { label: "Completed", value: data.conversionRates.completed, color: "bg-blue-50 text-blue-700" },
            { label: "Cancelled", value: data.conversionRates.cancelled, color: "bg-neutral-50 text-neutral-500" },
            { label: "Rejected", value: data.conversionRates.rejected, color: "bg-red-50 text-red-600" },
          ].map((item) => (
            <div key={item.label} className={cn("rounded-lg p-3 text-center", item.color)}>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-3 text-sm text-neutral-500">
          <span>Acceptance rate: <strong className="text-neutral-900">{data.conversionRates.acceptanceRate}%</strong></span>
          <span>Completion rate: <strong className="text-neutral-900">{data.conversionRates.completionRate}%</strong></span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Registrations over time */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="font-semibold text-neutral-900 mb-4">Registrations Over Time</h2>
          <div className="flex items-end gap-1 h-40">
            {data.registrations.map((r) => (
              <div key={r.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-neutral-500 font-medium">{r.total}</span>
                <div className="w-full flex flex-col gap-0.5" style={{ height: `${Math.max((r.total / maxReg) * 100, 2)}%` }}>
                  <div className="bg-blue-400 rounded-t-sm" style={{ flex: r.clients }} />
                  <div className="bg-purple-400 rounded-b-sm" style={{ flex: r.therapists || 0.01 }} />
                </div>
                <span className="text-[8px] text-neutral-400 whitespace-nowrap">{r.month.replace(" 20", "'")}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded-sm" /> Clients</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-400 rounded-sm" /> Therapists</span>
          </div>
        </div>

        {/* Bookings over time */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="font-semibold text-neutral-900 mb-4">Bookings Over Time</h2>
          <div className="flex items-end gap-1 h-40">
            {data.bookingsOverTime.map((b) => (
              <div key={b.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-neutral-500 font-medium">{b.count}</span>
                <div className="w-full bg-primary-500 rounded-t-sm min-h-[2px]" style={{ height: `${Math.max((b.count / maxBookings) * 100, 2)}%` }} />
                <span className="text-[8px] text-neutral-400 whitespace-nowrap">{b.month.replace(" 20", "'")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular services */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="font-semibold text-neutral-900 mb-4">Popular Services</h2>
          {data.popularServices.length === 0 ? (
            <p className="text-sm text-neutral-400">No booking data yet</p>
          ) : (
            <div className="space-y-3">
              {data.popularServices.map((s) => (
                <div key={s.serviceType}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-neutral-600">{formatServiceType(s.serviceType)}</span>
                    <span className="text-neutral-900 font-medium">{s.count}</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-400 rounded-full" style={{ width: `${(s.count / maxService) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular locations */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="font-semibold text-neutral-900 mb-4">Therapist Locations</h2>
          {data.popularLocations.length === 0 ? (
            <p className="text-sm text-neutral-400">No location data yet</p>
          ) : (
            <div className="space-y-3">
              {data.popularLocations.map((l, i) => (
                <div key={l.state} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-sm text-neutral-700">{l.state}</span>
                  </div>
                  <span className="text-sm font-medium text-neutral-900">{l.count} therapists</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
