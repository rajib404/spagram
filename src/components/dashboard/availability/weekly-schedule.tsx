"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface TimeBlock {
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  dayOfWeek: number;
  isActive: boolean;
  blocks: TimeBlock[];
}

interface Props {
  schedule: DaySchedule[];
  onChange: (schedule: DaySchedule[]) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
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

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function WeeklySchedule({ schedule, onChange, onSave, saving, dirty }: Props) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  function toggleDay(dayOfWeek: number) {
    const updated = schedule.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      if (d.isActive) {
        return { ...d, isActive: false, blocks: [] };
      }
      return {
        ...d,
        isActive: true,
        blocks: d.blocks.length > 0 ? d.blocks : [{ startTime: "09:00", endTime: "17:00" }],
      };
    });
    onChange(updated);
  }

  function updateBlock(dayOfWeek: number, blockIndex: number, field: "startTime" | "endTime", value: string) {
    const updated = schedule.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      const blocks = d.blocks.map((b, i) =>
        i === blockIndex ? { ...b, [field]: value } : b
      );
      return { ...d, blocks };
    });
    onChange(updated);
  }

  function addBlock(dayOfWeek: number) {
    const updated = schedule.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      const lastBlock = d.blocks[d.blocks.length - 1];
      const startMinutes = lastBlock
        ? timeToMin(lastBlock.endTime) + 60
        : 540; // 9am
      const endMinutes = startMinutes + 240; // +4h
      return {
        ...d,
        blocks: [
          ...d.blocks,
          {
            startTime: minToTime(Math.min(startMinutes, 1380)),
            endTime: minToTime(Math.min(endMinutes, 1410)),
          },
        ],
      };
    });
    onChange(updated);
  }

  function removeBlock(dayOfWeek: number, blockIndex: number) {
    const updated = schedule.map((d) => {
      if (d.dayOfWeek !== dayOfWeek) return d;
      const blocks = d.blocks.filter((_, i) => i !== blockIndex);
      return { ...d, blocks, isActive: blocks.length > 0 };
    });
    onChange(updated);
  }

  function getValidationError(day: DaySchedule): string | null {
    for (const block of day.blocks) {
      if (timeToMin(block.endTime) <= timeToMin(block.startTime)) {
        return "End time must be after start time";
      }
    }
    const sorted = [...day.blocks].sort(
      (a, b) => timeToMin(a.startTime) - timeToMin(b.startTime)
    );
    for (let i = 1; i < sorted.length; i++) {
      if (timeToMin(sorted[i].startTime) < timeToMin(sorted[i - 1].endTime)) {
        return "Time blocks overlap";
      }
    }
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Weekly Schedule
          </h2>
          <p className="text-sm text-neutral-500">
            Set your regular weekly working hours.
          </p>
        </div>
        <button
          onClick={onSave}
          disabled={saving || !dirty}
          className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Schedule"}
        </button>
      </div>

      {/* Visual preview bar */}
      <div className="grid grid-cols-7 gap-1.5 p-4 bg-white rounded-xl border border-neutral-200">
        {schedule.map((day) => (
          <div key={day.dayOfWeek} className="text-center">
            <p className="text-xs font-medium text-neutral-500 mb-1.5">
              {DAY_SHORT[day.dayOfWeek]}
            </p>
            <div className="h-24 bg-neutral-50 rounded-lg relative overflow-hidden">
              {day.isActive && day.blocks.map((block, i) => {
                const startPct = (timeToMin(block.startTime) / 1440) * 100;
                const endPct = (timeToMin(block.endTime) / 1440) * 100;
                return (
                  <div
                    key={i}
                    className="absolute left-0 right-0 bg-primary-400 rounded-sm mx-0.5"
                    style={{
                      top: `${startPct}%`,
                      height: `${Math.max(endPct - startPct, 2)}%`,
                    }}
                    title={`${formatTime12(block.startTime)} – ${formatTime12(block.endTime)}`}
                  />
                );
              })}
              {!day.isActive && (
                <div className="flex items-center justify-center h-full text-[10px] text-neutral-300">
                  Off
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Day-by-day editor */}
      <div className="space-y-2">
        {schedule.map((day) => {
          const error = day.isActive ? getValidationError(day) : null;
          const isExpanded = expandedDay === day.dayOfWeek;

          return (
            <div
              key={day.dayOfWeek}
              className={cn(
                "bg-white rounded-xl border transition-colors",
                error ? "border-error-200" : "border-neutral-200"
              )}
            >
              {/* Day header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() =>
                  setExpandedDay(isExpanded ? null : day.dayOfWeek)
                }
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDay(day.dayOfWeek);
                    }}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors",
                      day.isActive ? "bg-primary-600" : "bg-neutral-200"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                        day.isActive ? "translate-x-[22px]" : "translate-x-0.5"
                      )}
                    />
                  </button>
                  <span className="font-medium text-neutral-900">
                    {DAY_NAMES[day.dayOfWeek]}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {day.isActive && (
                    <span className="text-sm text-neutral-500">
                      {day.blocks
                        .map(
                          (b) =>
                            `${formatTime12(b.startTime)} – ${formatTime12(b.endTime)}`
                        )
                        .join(", ")}
                    </span>
                  )}
                  {!day.isActive && (
                    <span className="text-sm text-neutral-400">Unavailable</span>
                  )}
                  <svg
                    className={cn(
                      "w-4 h-4 text-neutral-400 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {/* Expanded editor */}
              {isExpanded && day.isActive && (
                <div className="px-4 pb-4 space-y-3 border-t border-neutral-100 pt-3">
                  {day.blocks.map((block, blockIdx) => (
                    <div key={blockIdx} className="flex items-center gap-3">
                      <select
                        value={block.startTime}
                        onChange={(e) =>
                          updateBlock(day.dayOfWeek, blockIdx, "startTime", e.target.value)
                        }
                        className="input py-2 text-sm"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {formatTime12(t)}
                          </option>
                        ))}
                      </select>

                      <span className="text-neutral-400 text-sm">to</span>

                      <select
                        value={block.endTime}
                        onChange={(e) =>
                          updateBlock(day.dayOfWeek, blockIdx, "endTime", e.target.value)
                        }
                        className="input py-2 text-sm"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {formatTime12(t)}
                          </option>
                        ))}
                      </select>

                      {day.blocks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBlock(day.dayOfWeek, blockIdx)}
                          className="p-1.5 text-neutral-400 hover:text-error-500 rounded-md hover:bg-error-50 transition-colors"
                          title="Remove time block"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addBlock(day.dayOfWeek)}
                    className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Time Block
                  </button>

                  {error && (
                    <p className="text-sm text-error-600 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function timeToMin(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
