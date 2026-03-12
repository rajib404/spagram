"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageThread } from "@/components/dashboard/messages/message-thread";

interface BookingDetail {
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
  outcallAddress: string | null;
  therapist: {
    displayName: string;
    slug: string;
    profilePhoto: string | null;
    city: string | null;
    state: string | null;
    incallAddress: string | null;
  };
  therapistUserId: string;
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

export default function UserBookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/user/bookings/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load booking");
        return res.json();
      })
      .then((data) => setBooking(data.booking))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">{error || "Booking not found"}</p>
        <Link href="/user/bookings" className="text-primary-600 hover:underline mt-2 inline-block text-sm">
          Back to bookings
        </Link>
      </div>
    );
  }

  const location = [booking.therapist.city, booking.therapist.state].filter(Boolean).join(", ");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link href="/user/bookings" className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to bookings
      </Link>

      {/* Booking summary card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <div className="flex items-start gap-4">
          <Link href={`/therapists/${booking.therapist.slug}`} className="flex-shrink-0">
            {booking.therapist.profilePhoto ? (
              <Image
                src={booking.therapist.profilePhoto}
                alt={booking.therapist.displayName}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-700">
                  {booking.therapist.displayName.charAt(0)}
                </span>
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/therapists/${booking.therapist.slug}`}
                className="font-semibold text-neutral-900 hover:text-primary-600 transition-colors"
              >
                {booking.therapist.displayName}
              </Link>
              <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-green-50 text-green-700 border-green-200">
                {booking.status === "ACCEPTED" ? "Confirmed" : booking.status}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-0.5">
              {booking.bookingNumber}
              {location && <> &middot; {location}</>}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-neutral-600">
              <span>{formatDate(booking.date)}</span>
              <span>{formatTime12(booking.startTime)} – {formatTime12(booking.endTime)}</span>
              <span>{formatServiceType(booking.serviceType)}</span>
              <span className="text-xs text-neutral-400">
                {booking.duration}min &middot; {booking.locationType === "INCALL" ? "Incall" : "Outcall"}
              </span>
            </div>
            {/* Address */}
            {booking.locationType === "INCALL" && booking.therapist.incallAddress && (
              <p className="mt-1.5 text-sm text-neutral-500">
                <span className="font-medium text-neutral-600">Studio:</span> {booking.therapist.incallAddress}
              </p>
            )}
            {booking.locationType === "OUTCALL" && booking.outcallAddress && (
              <p className="mt-1.5 text-sm text-neutral-500">
                <span className="font-medium text-neutral-600">Outcall:</span> {booking.outcallAddress}
              </p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-neutral-900">${parseFloat(booking.totalPrice).toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {booking.status === "ACCEPTED" ? (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Messages</h2>
          <MessageThread bookingId={booking.id} />
        </div>
      ) : (
        <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-8 text-center">
          <p className="text-sm text-neutral-500">
            Messages are available once the booking is confirmed by the therapist.
          </p>
        </div>
      )}
    </div>
  );
}
