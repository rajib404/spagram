"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TherapistNotifications, ClientNotifications } from "@/types";

export function useTherapistNotifications() {
  const sinceRef = useRef<string>(new Date().toISOString());
  const prevNewBookingsRef = useRef<number>(0);

  const { data } = useQuery<TherapistNotifications>({
    queryKey: ["therapist-notifications", sinceRef.current],
    queryFn: async () => {
      const res = await fetch(`/api/therapist/notifications?since=${encodeURIComponent(sinceRef.current)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  // Toast on new bookings
  if (data && data.newBookings > prevNewBookingsRef.current) {
    const diff = data.newBookings - prevNewBookingsRef.current;
    toast.info(`${diff} new booking${diff > 1 ? "s" : ""} received!`);
  }
  if (data) {
    prevNewBookingsRef.current = data.newBookings;
  }

  const bookingsBadge = (data?.newBookings ?? 0) + (data?.changedBookings ?? 0);
  const messagesBadge = data?.unreadMessages ?? 0;

  return { bookingsBadge, messagesBadge };
}

export function useClientNotifications() {
  const sinceRef = useRef<string>(new Date().toISOString());
  const prevStatusRef = useRef<number>(0);

  const { data } = useQuery<ClientNotifications>({
    queryKey: ["client-notifications", sinceRef.current],
    queryFn: async () => {
      const res = await fetch(`/api/user/notifications?since=${encodeURIComponent(sinceRef.current)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  // Toast on booking status changes
  if (data && data.statusChanges > prevStatusRef.current) {
    const diff = data.statusChanges - prevStatusRef.current;
    toast.info(`${diff} booking${diff > 1 ? "s" : ""} updated!`);
  }
  if (data) {
    prevStatusRef.current = data.statusChanges;
  }

  const bookingsBadge = data?.statusChanges ?? 0;
  const messagesBadge = data?.unreadMessages ?? 0;

  return { bookingsBadge, messagesBadge };
}
