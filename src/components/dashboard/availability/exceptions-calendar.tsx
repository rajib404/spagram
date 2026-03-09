"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ExceptionData {
  id: string;
  date: string;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      options.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      );
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export function ExceptionsCalendar() {
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [exceptions, setExceptions] = useState<ExceptionData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"unavailable" | "custom">("unavailable");
  const [modalStartTime, setModalStartTime] = useState("09:00");
  const [modalEndTime, setModalEndTime] = useState("17:00");
  const [modalReason, setModalReason] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  const monthKey = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}`;

  const fetchExceptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/therapist/availability/exceptions?month=${monthKey}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExceptions(data.exceptions || []);
    } catch {
      toast.error("Failed to load exceptions");
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    fetchExceptions();
  }, [fetchExceptions]);

  // Calendar math
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function getExceptionForDate(dateStr: string): ExceptionData | undefined {
    return exceptions.find((e) => {
      const d = new Date(e.date);
      return d.toISOString().split("T")[0] === dateStr;
    });
  }

  function openModal(dateStr: string) {
    const existing = getExceptionForDate(dateStr);
    setSelectedDate(dateStr);
    if (existing) {
      setModalMode(existing.isAvailable ? "custom" : "unavailable");
      setModalStartTime(existing.startTime || "09:00");
      setModalEndTime(existing.endTime || "17:00");
      setModalReason(existing.reason || "");
    } else {
      setModalMode("unavailable");
      setModalStartTime("09:00");
      setModalEndTime("17:00");
      setModalReason("");
    }
    setModalOpen(true);
  }

  async function handleSaveException() {
    if (!selectedDate) return;
    setModalSaving(true);

    try {
      const res = await fetch("/api/therapist/availability/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          isAvailable: modalMode === "custom",
          startTime: modalMode === "custom" ? modalStartTime : null,
          endTime: modalMode === "custom" ? modalEndTime : null,
          reason: modalReason || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }

      toast.success("Exception saved");
      setModalOpen(false);
      fetchExceptions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setModalSaving(false);
    }
  }

  async function handleDeleteException(id: string) {
    try {
      const res = await fetch(
        `/api/therapist/availability/exceptions?id=${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      toast.success("Exception removed");
      fetchExceptions();
      setModalOpen(false);
    } catch {
      toast.error("Failed to delete exception");
    }
  }

  function prevMonth() {
    setCalendarMonth(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCalendarMonth(new Date(year, month + 1, 1));
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">
          Exceptions & Overrides
        </h2>
        <p className="text-sm text-neutral-500">
          Click on a date to mark it as unavailable or set custom hours.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h3 className="font-semibold text-neutral-900">
            {calendarMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-neutral-400 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Leading empty cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateObj = new Date(year, month, day);
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isPast = dateObj < today;
            const isToday = dateObj.getTime() === today.getTime();
            const exception = getExceptionForDate(dateStr);

            let bgClass = "bg-neutral-50 hover:bg-neutral-100 text-neutral-700";
            let indicator = null;

            if (exception) {
              if (!exception.isAvailable) {
                bgClass = "bg-error-50 hover:bg-error-100 text-error-700 ring-1 ring-error-200";
                indicator = (
                  <div className="w-1.5 h-1.5 rounded-full bg-error-500 absolute bottom-1 left-1/2 -translate-x-1/2" />
                );
              } else {
                bgClass = "bg-amber-50 hover:bg-amber-100 text-amber-700 ring-1 ring-amber-200";
                indicator = (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute bottom-1 left-1/2 -translate-x-1/2" />
                );
              }
            }

            if (isPast) {
              bgClass = "bg-neutral-50 text-neutral-300 cursor-default";
            }

            return (
              <button
                key={day}
                type="button"
                onClick={() => !isPast && openModal(dateStr)}
                disabled={isPast}
                className={cn(
                  "aspect-square rounded-lg text-sm font-medium relative transition-colors",
                  bgClass,
                  isToday && "ring-2 ring-primary-400"
                )}
              >
                {day}
                {indicator}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="text-center py-2 text-sm text-neutral-400">
            Loading...
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <div className="w-3 h-3 rounded-full bg-error-500" />
            Unavailable
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            Custom Hours
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <div className="w-3 h-3 rounded ring-2 ring-primary-400" />
            Today
          </div>
        </div>
      </div>

      {/* Upcoming exceptions list */}
      {exceptions.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="px-5 py-3 border-b border-neutral-100">
            <h3 className="font-medium text-sm text-neutral-900">
              Exceptions This Month
            </h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {exceptions.map((exc) => {
              const d = new Date(exc.date);
              return (
                <div
                  key={exc.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        exc.isAvailable ? "bg-amber-500" : "bg-error-500"
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {d.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {exc.isAvailable && exc.startTime && exc.endTime
                          ? `Custom: ${formatTime12(exc.startTime)} – ${formatTime12(exc.endTime)}`
                          : "Unavailable"}
                        {exc.reason && ` — ${exc.reason}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteException(exc.id)}
                    className="text-neutral-400 hover:text-error-500 p-1"
                    title="Remove exception"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exception Modal */}
      {modalOpen && selectedDate && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-neutral-900 text-lg mb-1">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "long", month: "long", day: "numeric", year: "numeric" }
                )}
              </h3>
              <p className="text-sm text-neutral-500 mb-5">
                Set an exception for this date.
              </p>

              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setModalMode("unavailable")}
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium text-center transition-colors",
                    modalMode === "unavailable"
                      ? "border-error-300 bg-error-50 text-error-700"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                  )}
                >
                  <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Day Off
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode("custom")}
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium text-center transition-colors",
                    modalMode === "custom"
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                  )}
                >
                  <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Custom Hours
                </button>
              </div>

              {/* Custom hours fields */}
              {modalMode === "custom" && (
                <div className="flex items-center gap-3 mb-4">
                  <select
                    value={modalStartTime}
                    onChange={(e) => setModalStartTime(e.target.value)}
                    className="input py-2 text-sm flex-1"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {formatTime12(t)}
                      </option>
                    ))}
                  </select>
                  <span className="text-neutral-400 text-sm">to</span>
                  <select
                    value={modalEndTime}
                    onChange={(e) => setModalEndTime(e.target.value)}
                    className="input py-2 text-sm flex-1"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {formatTime12(t)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reason */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Reason (optional)
                </label>
                <input
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="input w-full"
                  placeholder="e.g. Personal day, Holiday"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div>
                  {getExceptionForDate(selectedDate) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteException(
                          getExceptionForDate(selectedDate)!.id
                        )
                      }
                      className="text-sm text-error-600 hover:text-error-700 font-medium"
                    >
                      Remove Exception
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveException}
                    disabled={modalSaving}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {modalSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
