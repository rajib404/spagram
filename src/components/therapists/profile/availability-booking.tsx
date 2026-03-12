"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { getStripeClient } from "@/lib/stripe-client";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DURATIONS = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
];

interface WeeklyAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface AvailabilityBookingProps {
  therapistProfileId: string;
  massageTypes: string[];
  incallAvailable: boolean;
  outcallAvailable: boolean;
  incallPricePerHour: number | null;
  outcallPricePerHour: number | null;
}

function CheckoutForm({ bookingId, bookingFee }: { bookingId: string; bookingFee: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Please check your card details.");
      setPaying(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/user/bookings/${bookingId}?success=true`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed. Please try again.");
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
        <CreditCard className="h-4 w-4 text-primary-500" />
        Enter payment details
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <PaymentElement />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <ShieldCheck className="h-3.5 w-3.5" />
        A hold of ${bookingFee.toFixed(2)} will be placed on your card. You will only be charged if the therapist accepts the booking.
      </div>

      <button
        type="submit"
        disabled={paying || !stripe || !elements}
        className="btn-primary w-full py-3 text-base"
      >
        {paying ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </span>
        ) : (
          "Confirm & Pay"
        )}
      </button>
    </form>
  );
}

export function AvailabilityBooking({
  therapistProfileId,
  massageTypes,
  incallAvailable,
  outcallAvailable,
  incallPricePerHour,
  outcallPricePerHour,
}: AvailabilityBookingProps) {
  const router = useRouter();
  const { isAuthenticated } = useCurrentUser();

  const [weekly, setWeekly] = useState<WeeklyAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Booking form state
  const [selectedSlot, setSelectedSlot] = useState("");
  const [duration, setDuration] = useState(60);
  const [serviceType, setServiceType] = useState(massageTypes[0] || "");
  const [locationType, setLocationType] = useState(
    incallAvailable ? "INCALL" : "OUTCALL"
  );
  const [outcallAddress, setOutcallAddress] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Payment step state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Fetch weekly availability
  useEffect(() => {
    fetch(`/api/therapists/${therapistProfileId}/availability`)
      .then((r) => r.json())
      .then((d) => setWeekly(d.weekly || []))
      .catch(() => {});
  }, [therapistProfileId]);

  // Fetch slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    fetch(
      `/api/therapists/${therapistProfileId}/availability?date=${selectedDate}`
    )
      .then((r) => r.json())
      .then((d) => {
        setSlots(d.slots || []);
        setSelectedSlot("");
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, therapistProfileId]);

  // Price calculation
  const hourlyRate =
    locationType === "INCALL" ? incallPricePerHour : outcallPricePerHour;
  const totalPrice = hourlyRate ? (hourlyRate * duration) / 60 : 0;
  const bookingFee = Math.round(totalPrice * 0.1 * 100) / 100;

  // Available days set
  const availableDays = new Set(weekly.map((w) => w.dayOfWeek));

  // Build calendar grid
  const daysInMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDay = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  ).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function handleDateClick(day: number) {
    const d = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day
    );
    const iso = d.toISOString().split("T")[0];
    setSelectedDate(iso === selectedDate ? "" : iso);
  }

  function computeEndTime(start: string, dur: number): string {
    const [h, m] = start.split(":").map(Number);
    const totalMin = h * 60 + m + dur;
    return `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
  }

  async function handleBooking() {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?callbackUrl=${returnUrl}`);
      return;
    }

    if (!selectedDate || !selectedSlot || !serviceType) return;

    setBookingLoading(true);
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapistProfileId,
          date: selectedDate,
          startTime: selectedSlot,
          endTime: computeEndTime(selectedSlot, duration),
          duration,
          serviceType,
          locationType,
          outcallAddress: locationType === "OUTCALL" ? outcallAddress : null,
          clientNotes: clientNotes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Booking failed");
        setBookingLoading(false);
        return;
      }

      const data = await res.json();
      setBookingId(data.booking.id);
      setClientSecret(data.clientSecret);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <section id="booking">
      <h2 className="text-xl font-semibold text-neutral-900">
        Availability & Booking
      </h2>

      {/* Weekly schedule overview */}
      <div className="mt-4 grid grid-cols-7 gap-1">
        {DAY_NAMES.map((name, i) => {
          const blocks = weekly.filter((w) => w.dayOfWeek === i);
          return (
            <div
              key={name}
              className={cn(
                "rounded-lg p-2 text-center text-xs",
                blocks.length > 0
                  ? "bg-success-50 text-success-700"
                  : "bg-neutral-50 text-neutral-400"
              )}
            >
              <p className="font-medium">{name}</p>
              {blocks.length > 0 ? (
                blocks.map((b, idx) => (
                  <p key={idx} className="mt-0.5 text-[10px]">
                    {b.startTime}-{b.endTime}
                  </p>
                ))
              ) : (
                <p className="mt-0.5 text-[10px]">Off</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Calendar date picker */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              setCalendarMonth(
                new Date(
                  calendarMonth.getFullYear(),
                  calendarMonth.getMonth() - 1,
                  1
                )
              )
            }
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-semibold text-neutral-900">
            {calendarMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button
            onClick={() =>
              setCalendarMonth(
                new Date(
                  calendarMonth.getFullYear(),
                  calendarMonth.getMonth() + 1,
                  1
                )
              )
            }
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="mt-3 grid grid-cols-7 text-center text-[10px] font-medium text-neutral-400">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="mt-1 grid grid-cols-7 gap-0.5">
          {/* Padding for first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(
              calendarMonth.getFullYear(),
              calendarMonth.getMonth(),
              day
            );
            const dow = date.getDay();
            const isPast = date < today;
            const isAvailDay = availableDays.has(dow);
            const iso = date.toISOString().split("T")[0];
            const isSelected = selectedDate === iso;
            const isClickable = !isPast && isAvailDay;

            return (
              <button
                key={day}
                disabled={!isClickable}
                onClick={() => handleDateClick(day)}
                className={cn(
                  "relative flex h-9 items-center justify-center rounded-lg text-xs transition-colors",
                  isSelected
                    ? "bg-primary-600 font-semibold text-white"
                    : isClickable
                      ? "font-medium text-neutral-800 hover:bg-primary-50"
                      : "text-neutral-300"
                )}
              >
                {day}
                {isClickable && !isSelected && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-success-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && !clientSecret && (
        <div className="mt-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <Clock className="h-4 w-4" />
            Available times for{" "}
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </h3>

          {slotsLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading time slots...
            </div>
          ) : slots.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    selectedSlot === slot
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">
              No available time slots for this date.
            </p>
          )}
        </div>
      )}

      {/* Booking form */}
      {selectedSlot && !clientSecret && (
        <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50/50 p-5">
          <h3 className="font-semibold text-neutral-900">Book this session</h3>

          <div className="mt-4 space-y-4">
            {/* Date & time display */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-neutral-700">
                <Calendar className="h-4 w-4 text-primary-500" />
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </div>
              <div className="flex items-center gap-2 text-neutral-700">
                <Clock className="h-4 w-4 text-primary-500" />
                {selectedSlot} - {computeEndTime(selectedSlot, duration)}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Duration
              </label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      duration === d.value
                        ? "border-primary-600 bg-primary-100 text-primary-700"
                        : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Service type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Massage type
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="input bg-white"
              >
                {massageTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Location type */}
            {incallAvailable && outcallAvailable && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Location
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLocationType("INCALL")}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                      locationType === "INCALL"
                        ? "border-primary-600 bg-primary-100 text-primary-700"
                        : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    Incall — ${incallPricePerHour}/hr
                  </button>
                  <button
                    onClick={() => setLocationType("OUTCALL")}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                      locationType === "OUTCALL"
                        ? "border-primary-600 bg-primary-100 text-primary-700"
                        : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    Outcall — ${outcallPricePerHour}/hr
                  </button>
                </div>
              </div>
            )}

            {/* Outcall address */}
            {locationType === "OUTCALL" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Your address
                </label>
                <input
                  type="text"
                  value={outcallAddress}
                  onChange={(e) => setOutcallAddress(e.target.value)}
                  className="input bg-white"
                  placeholder="Enter your full address"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Notes for therapist{" "}
                <span className="font-normal text-neutral-400">(optional)</span>
              </label>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="input bg-white"
                rows={2}
                placeholder="Any specific areas to focus on, allergies, etc."
              />
            </div>

            {/* Price summary */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between text-sm text-neutral-600">
                <span>
                  ${hourlyRate} x{" "}
                  {duration >= 60
                    ? `${duration / 60} hr${duration > 60 ? "s" : ""}`
                    : `${duration} min`}
                </span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm text-neutral-600">
                <span>Booking fee (10%)</span>
                <span>${bookingFee.toFixed(2)}</span>
              </div>
              <div className="mt-2 border-t border-neutral-100 pt-2">
                <div className="flex items-center justify-between font-semibold text-neutral-900">
                  <span>Total</span>
                  <span>${(totalPrice + bookingFee).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Book button */}
            <button
              onClick={handleBooking}
              disabled={
                bookingLoading ||
                (locationType === "OUTCALL" && !outcallAddress)
              }
              className="btn-primary w-full py-3 text-base"
            >
              {bookingLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Booking...
                </span>
              ) : !isAuthenticated ? (
                "Sign in to book"
              ) : (
                "Book now"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Payment step */}
      {clientSecret && bookingId && (
        <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50/50 p-5">
          <h3 className="font-semibold text-neutral-900">Complete Payment</h3>
          <p className="mt-1 text-sm text-neutral-600">
            Your booking has been created. Please enter your card details to confirm.
          </p>

          {/* Price summary recap */}
          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between text-sm text-neutral-600">
              <span>
                ${hourlyRate} x{" "}
                {duration >= 60
                  ? `${duration / 60} hr${duration > 60 ? "s" : ""}`
                  : `${duration} min`}
              </span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm text-neutral-600">
              <span>Booking fee (10%)</span>
              <span>${bookingFee.toFixed(2)}</span>
            </div>
            <div className="mt-2 border-t border-neutral-100 pt-2">
              <div className="flex items-center justify-between font-semibold text-neutral-900">
                <span>Total</span>
                <span>${(totalPrice + bookingFee).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Elements
              stripe={getStripeClient()}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    borderRadius: "8px",
                  },
                },
              }}
            >
              <CheckoutForm bookingId={bookingId} bookingFee={bookingFee} />
            </Elements>
          </div>
        </div>
      )}
    </section>
  );
}
