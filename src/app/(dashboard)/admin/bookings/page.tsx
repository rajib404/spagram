"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BookingRow {
  id: string;
  bookingNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  serviceType: string;
  locationType: string;
  totalPrice: string;
  bookingFee: string;
  status: string;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  therapistName: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-green-50 text-green-700 border-green-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED: "bg-neutral-50 text-neutral-500 border-neutral-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
  NO_SHOW: "bg-orange-50 text-orange-600 border-orange-200",
};

function formatServiceType(type: string): string {
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/admin/bookings?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookings(data.bookings);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, dateFrom, dateTo]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Booking Overview</h1>
        <p className="text-neutral-500 mt-1">{total} total bookings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search booking #, client, therapist..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input max-w-xs" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input max-w-[160px]">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
          <option value="NO_SHOW">No Show</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="input max-w-[160px]" placeholder="From" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="input max-w-[160px]" placeholder="To" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Booking</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 hidden md:table-cell">Therapist</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600 hidden lg:table-cell">Service</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-neutral-100 rounded animate-pulse" /></td></tr>
                ))
              ) : bookings.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-400">No bookings found</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">{b.bookingNumber}</p>
                      <p className="text-xs text-neutral-400">{new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      <p className="text-xs text-neutral-400">{b.startTime} – {b.endTime}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-neutral-900">{b.clientName}</p>
                      <p className="text-xs text-neutral-400">{b.clientEmail}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-neutral-600">{b.therapistName}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-neutral-600">{formatServiceType(b.serviceType)}</p>
                      <p className="text-xs text-neutral-400">{b.duration}min &middot; {b.locationType}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", STATUS_COLORS[b.status] ?? "bg-neutral-100 text-neutral-500 border-neutral-200")}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-medium text-neutral-900">${parseFloat(b.totalPrice).toFixed(0)}</p>
                      <p className="text-xs text-neutral-400">${parseFloat(b.bookingFee).toFixed(0)} fee</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-neutral-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-neutral-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="text-xs px-3 py-1 border border-neutral-200 rounded-md disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="text-xs px-3 py-1 border border-neutral-200 rounded-md disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
