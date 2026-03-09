"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  bookingNumber: string;
  date: string;
  serviceType: string;
  status: string;
  totalPrice: string;
  bookingFee: string;
  revenue: string;
  clientName: string;
}

interface EarningsData {
  totalEarnings: string;
  monthlyEarnings: string;
  pendingPayouts: string;
  recentTransactions: Transaction[];
}

function formatCurrency(amount: string) {
  return `$${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-700",
  ACCEPTED: "bg-blue-50 text-blue-700",
};

export default function EarningsPage() {
  const { data, isLoading, error } = useQuery<EarningsData>({
    queryKey: ["therapist-earnings"],
    queryFn: async () => {
      const res = await fetch("/api/therapist/earnings");
      if (!res.ok) throw new Error("Failed to load earnings");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded bg-neutral-200" />
          <div className="h-4 w-56 rounded bg-neutral-100" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-200 bg-white p-5"
            >
              <div className="h-3 w-24 rounded bg-neutral-100" />
              <div className="mt-3 h-8 w-20 rounded bg-neutral-200" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 p-5">
            <div className="h-5 w-40 rounded bg-neutral-200" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-neutral-100 p-5 last:border-0">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-neutral-200" />
                <div className="h-3 w-56 rounded bg-neutral-100" />
              </div>
              <div className="h-5 w-16 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">
          Failed to load earnings data. Please try again later.
        </p>
      </div>
    );
  }

  const stats = [
    { label: "Total Earnings", value: formatCurrency(data.totalEarnings) },
    { label: "This Month", value: formatCurrency(data.monthlyEarnings) },
    { label: "Pending Payouts", value: formatCurrency(data.pendingPayouts) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Earnings</h1>
        <p className="text-neutral-500 mt-1">
          Track your revenue and recent transactions.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-neutral-200 bg-white p-5"
          >
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-neutral-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">
            Recent Transactions
          </h2>
        </div>

        {data.recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            No transactions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Fee</th>
                  <th className="px-5 py-3">Revenue</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 whitespace-nowrap text-neutral-700">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-medium text-neutral-900">
                      {tx.clientName}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-neutral-600">
                      {tx.serviceType}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-neutral-700">
                      {formatCurrency(tx.totalPrice)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-neutral-400">
                      -{formatCurrency(tx.bookingFee)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-medium text-neutral-900">
                      {formatCurrency(tx.revenue)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          STATUS_STYLES[tx.status] ?? "bg-neutral-100 text-neutral-600"
                        )}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
