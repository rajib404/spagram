"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Booking } from "@/app/(dashboard)/therapist/bookings/page";

interface Props {
  booking: Booking;
  tab: string;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
  actionsDisabled: boolean;
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

function getTimeUntilExpiry(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left to respond`;
  return `${minutes}m left to respond`;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED: "bg-green-50 text-green-700 border-green-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED: "bg-neutral-50 text-neutral-500 border-neutral-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
};

export function BookingCard({
  booking,
  tab,
  onAccept,
  onReject,
  onComplete,
  onCancel,
  onSaveNotes,
  actionsDisabled,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(booking.therapistNotes || "");
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const expiryText = tab === "pending" ? getTimeUntilExpiry(booking.tokenExpiresAt) : null;

  function handleAction(action: string) {
    setShowConfirm(null);
    switch (action) {
      case "accept":
        onAccept(booking.id);
        break;
      case "reject":
        onReject(booking.id);
        break;
      case "complete":
        onComplete(booking.id);
        break;
      case "cancel":
        onCancel(booking.id);
        break;
    }
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Main Row */}
      <div
        className="flex items-start gap-4 p-4 sm:p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Client Avatar */}
        <div className="flex-shrink-0">
          {booking.client.image ? (
            <Image
              src={booking.client.image}
              alt={booking.client.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700">
                {booking.client.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-neutral-900">
                  {booking.client.name}
                </h3>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full border font-medium",
                    STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING
                  )}
                >
                  {booking.status === "ACCEPTED" && tab === "upcoming"
                    ? "Confirmed"
                    : booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                </span>
              </div>
              <p className="text-sm text-neutral-500 mt-0.5">
                {booking.bookingNumber}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-neutral-900">
                ${parseFloat(booking.totalPrice).toFixed(0)}
              </p>
              <p className="text-xs text-neutral-400">
                ${parseFloat(booking.bookingFee).toFixed(0)} fee
              </p>
            </div>
          </div>

          {/* Details row */}
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

          {/* Expiry warning for pending */}
          {expiryText && (
            <p
              className={cn(
                "text-xs mt-2 flex items-center gap-1",
                expiryText === "Expired" ? "text-red-500" : "text-amber-600"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {expiryText}
            </p>
          )}
        </div>

        {/* Expand icon */}
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

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-neutral-100 p-4 sm:p-5 space-y-4">
          {/* Client Notes */}
          {booking.clientNotes && (
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                Client Notes
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
                Outcall Address
              </p>
              <p className="text-sm text-neutral-700">{booking.outcallAddress}</p>
            </div>
          )}

          {/* Therapist Notes (editable for upcoming) */}
          {(tab === "upcoming" || tab === "past") && (
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                Your Notes
              </p>
              <div className="flex gap-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add private notes about this session..."
                  rows={2}
                  className="input flex-1 text-sm resize-none"
                />
                {notes !== (booking.therapistNotes || "") && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveNotes(booking.id, notes);
                    }}
                    className="self-end px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Review info for past */}
          {tab === "past" && booking.status === "COMPLETED" && (
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                Review
              </p>
              {booking.review ? (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <svg
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < booking.review!.rating
                            ? "text-amber-400"
                            : "text-neutral-200"
                        )}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {booking.review.comment && (
                    <p className="text-sm text-neutral-600">
                      {booking.review.comment}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 italic">
                  No review yet
                </p>
              )}
            </div>
          )}

          {/* Booking meta */}
          <div className="flex items-center gap-4 text-xs text-neutral-400 pt-2 border-t border-neutral-100">
            <span>Booked {formatDate(booking.createdAt)}</span>
            <span>{booking.client.email}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {tab === "pending" && (
              <>
                {showConfirm === "reject" ? (
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                    <span className="text-sm text-red-700">Decline this booking?</span>
                    <button
                      onClick={() => handleAction("reject")}
                      disabled={actionsDisabled}
                      className="text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowConfirm(null)}
                      className="text-sm text-neutral-500 hover:text-neutral-700"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction("accept");
                      }}
                      disabled={actionsDisabled}
                      className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfirm("reject");
                      }}
                      disabled={actionsDisabled}
                      className="px-4 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      Decline
                    </button>
                  </>
                )}
              </>
            )}

            {tab === "upcoming" && booking.status === "ACCEPTED" && (
              <Link
                href={`/therapist/bookings/${booking.id}`}
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 text-sm font-medium border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Message Client
              </Link>
            )}

            {tab === "upcoming" && (
              <>
                {showConfirm === "complete" ? (
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                    <span className="text-sm text-blue-700">Mark as complete?</span>
                    <button
                      onClick={() => handleAction("complete")}
                      disabled={actionsDisabled}
                      className="text-sm font-medium text-blue-700 hover:text-blue-800 disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowConfirm(null)}
                      className="text-sm text-neutral-500 hover:text-neutral-700"
                    >
                      No
                    </button>
                  </div>
                ) : showConfirm === "cancel" ? (
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                    <span className="text-sm text-red-700">Cancel this booking?</span>
                    <button
                      onClick={() => handleAction("cancel")}
                      disabled={actionsDisabled}
                      className="text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowConfirm(null)}
                      className="text-sm text-neutral-500 hover:text-neutral-700"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfirm("complete");
                      }}
                      disabled={actionsDisabled}
                      className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfirm("cancel");
                      }}
                      disabled={actionsDisabled}
                      className="px-4 py-2 text-sm font-medium border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
