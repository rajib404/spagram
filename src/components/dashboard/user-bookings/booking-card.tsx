"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserBooking } from "@/app/(dashboard)/user/bookings/page";

interface Props {
  booking: UserBooking;
  tab: string;
  onCancel: (id: string) => void;
  onLeaveReview?: (booking: UserBooking) => void;
  actionDisabled: boolean;
}

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatServiceType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-green-50 text-green-700 border-green-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED: "bg-neutral-50 text-neutral-500 border-neutral-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Declined",
};

export function UserBookingCard({ booking, tab, onCancel, actionDisabled }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Main Row */}
      <div
        className="flex items-start gap-4 p-4 sm:p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Therapist Avatar */}
        <Link
          href={`/therapists/${booking.therapist.slug}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        >
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

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/therapists/${booking.therapist.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-neutral-900 hover:text-primary-600 transition-colors"
                >
                  {booking.therapist.displayName}
                </Link>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full border font-medium",
                    STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING
                  )}
                >
                  {STATUS_LABELS[booking.status] || booking.status}
                </span>
              </div>
              <p className="text-sm text-neutral-500 mt-0.5">
                {booking.bookingNumber}
                {booking.therapist.city && (
                  <> &middot; {booking.therapist.city}{booking.therapist.state ? `, ${booking.therapist.state}` : ""}</>
                )}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-neutral-900">
                ${parseFloat(booking.totalPrice).toFixed(0)}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-neutral-600">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {formatDate(booking.date)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime12(booking.startTime)} – {formatTime12(booking.endTime)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              </svg>
              {formatServiceType(booking.serviceType)}
            </span>
            <span className="text-xs text-neutral-400">
              {booking.duration}min &middot;{" "}
              {booking.locationType === "INCALL" ? "Incall" : "Outcall"}
            </span>
          </div>
        </div>

        {/* Expand */}
        <svg
          className={cn(
            "w-4 h-4 text-neutral-400 transition-transform flex-shrink-0 mt-1",
            expanded && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-neutral-100 p-4 sm:p-5 space-y-4">
          {/* Client Notes */}
          {booking.clientNotes && (
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                Your Notes
              </p>
              <p className="text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3">
                {booking.clientNotes}
              </p>
            </div>
          )}

          {/* Outcall Address */}
          {booking.locationType === "OUTCALL" && booking.outcallAddress && (
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                Session Location
              </p>
              <p className="text-sm text-neutral-700">{booking.outcallAddress}</p>
            </div>
          )}

          {/* Review display for past */}
          {tab === "past" && booking.review && (
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                Your Review
              </p>
              <div className="bg-neutral-50 rounded-lg p-3">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < booking.review!.rating ? "text-amber-400" : "text-neutral-200"
                      )}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  {booking.review.title && (
                    <span className="ml-2 text-sm font-medium text-neutral-700">
                      {booking.review.title}
                    </span>
                  )}
                </div>
                {booking.review.comment && (
                  <p className="text-sm text-neutral-600">{booking.review.comment}</p>
                )}
              </div>
            </div>
          )}

          {/* Booking meta */}
          <div className="flex items-center gap-4 text-xs text-neutral-400 pt-2 border-t border-neutral-100">
            <span>Booked {formatDate(booking.createdAt)}</span>
            <span>Fee: ${parseFloat(booking.bookingFee).toFixed(2)}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Cancel for pending/upcoming */}
            {(tab === "pending" || tab === "upcoming") && (
              <>
                {showCancelConfirm ? (
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                    <span className="text-sm text-red-700">
                      {tab === "upcoming"
                        ? "Cancel this confirmed booking? A refund will be issued."
                        : "Cancel this booking?"}
                    </span>
                    <button
                      onClick={() => {
                        setShowCancelConfirm(false);
                        onCancel(booking.id);
                      }}
                      disabled={actionDisabled}
                      className="text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="text-sm text-neutral-500 hover:text-neutral-700"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCancelConfirm(true);
                    }}
                    disabled={actionDisabled}
                    className="px-4 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
              </>
            )}

            {/* Message + View therapist for upcoming */}
            {tab === "upcoming" && booking.status === "ACCEPTED" && (
              <Link
                href={`/user/bookings/${booking.id}`}
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 text-sm font-medium border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Message Therapist
              </Link>
            )}
            {tab === "upcoming" && (
              <Link
                href={`/therapists/${booking.therapist.slug}`}
                className="px-4 py-2 text-sm font-medium border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                View Therapist
              </Link>
            )}

            {/* Leave review for past completed */}
            {tab === "past" && booking.status === "COMPLETED" && !booking.review && (
              <Link
                href={`/user/bookings/${booking.id}/review`}
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Leave Review
              </Link>
            )}

            {/* Rebook for cancelled */}
            {tab === "cancelled" && (
              <Link
                href={`/therapists/${booking.therapist.slug}`}
                className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Rebook
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
