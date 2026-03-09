"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { WeeklySchedule, type DaySchedule } from "@/components/dashboard/availability/weekly-schedule";
import { ExceptionsCalendar } from "@/components/dashboard/availability/exceptions-calendar";

function buildEmptySchedule(): DaySchedule[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    isActive: false,
    blocks: [],
  }));
}

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(buildEmptySchedule());
  const [originalSchedule, setOriginalSchedule] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch("/api/therapist/availability");
      if (!res.ok) throw new Error();
      const data = await res.json();

      // Build schedule from availability records
      const built = buildEmptySchedule();
      for (const record of data.availability || []) {
        const day = built[record.dayOfWeek];
        day.isActive = record.isActive;
        day.blocks.push({
          startTime: record.startTime,
          endTime: record.endTime,
        });
      }

      // Sort blocks by start time
      for (const day of built) {
        day.blocks.sort((a, b) => {
          const [ah, am] = a.startTime.split(":").map(Number);
          const [bh, bm] = b.startTime.split(":").map(Number);
          return ah * 60 + am - (bh * 60 + bm);
        });
        if (day.blocks.length > 0) {
          day.isActive = true;
        }
      }

      setSchedule(built);
      setOriginalSchedule(JSON.stringify(built));
    } catch {
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const isDirty = JSON.stringify(schedule) !== originalSchedule;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/therapist/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save");
      }

      toast.success("Schedule saved");
      setOriginalSchedule(JSON.stringify(schedule));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  async function handleBlockNextWeek() {
    setQuickActionLoading("block");
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      // Next Monday
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + (8 - dayOfWeek));

      const promises = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(nextMonday);
        date.setDate(nextMonday.getDate() + i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        promises.push(
          fetch("/api/therapist/availability/exceptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: dateStr,
              isAvailable: false,
              reason: "Blocked week",
            }),
          })
        );
      }

      await Promise.all(promises);
      toast.success("Next week blocked");
      // Force re-render of exceptions calendar by reloading the page section
      window.dispatchEvent(new Event("exceptions-updated"));
    } catch {
      toast.error("Failed to block next week");
    } finally {
      setQuickActionLoading(null);
    }
  }

  async function handleCopyToNextWeek() {
    setQuickActionLoading("copy");
    try {
      // Get current week's exceptions (if any custom hours)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + (8 - dayOfWeek));

      // For each day of next week, use the weekly schedule
      // but remove any existing exceptions so the regular schedule applies
      const promises = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(nextMonday);
        date.setDate(nextMonday.getDate() + i);
        const nextDayOfWeek = date.getDay();
        const daySchedule = schedule[nextDayOfWeek];

        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        if (daySchedule.isActive && daySchedule.blocks.length > 0) {
          // Set custom hours based on the first block of the current schedule
          promises.push(
            fetch("/api/therapist/availability/exceptions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                date: dateStr,
                isAvailable: true,
                startTime: daySchedule.blocks[0].startTime,
                endTime: daySchedule.blocks[daySchedule.blocks.length - 1].endTime,
                reason: "Copied from weekly schedule",
              }),
            })
          );
        }
      }

      await Promise.all(promises);
      toast.success("Schedule copied to next week");
      window.dispatchEvent(new Event("exceptions-updated"));
    } catch {
      toast.error("Failed to copy schedule");
    } finally {
      setQuickActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-8 bg-neutral-200 rounded w-40" />
          <div className="h-4 bg-neutral-100 rounded w-72 mt-2" />
        </div>
        <div className="h-64 bg-white rounded-xl border border-neutral-200" />
        <div className="h-80 bg-white rounded-xl border border-neutral-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Availability</h1>
          <p className="text-neutral-500 mt-1">
            Set your weekly schedule and manage time-off.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleBlockNextWeek}
          disabled={quickActionLoading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          {quickActionLoading === "block" ? "Blocking..." : "Block Next Week"}
        </button>
        <button
          onClick={handleCopyToNextWeek}
          disabled={quickActionLoading !== null}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
          </svg>
          {quickActionLoading === "copy" ? "Copying..." : "Copy This Week to Next"}
        </button>
      </div>

      {/* Weekly Schedule */}
      <WeeklySchedule
        schedule={schedule}
        onChange={setSchedule}
        onSave={handleSave}
        saving={saving}
        dirty={isDirty}
      />

      {/* Exceptions Calendar */}
      <ExceptionsCalendar />
    </div>
  );
}
