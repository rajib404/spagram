"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (value: number) => string;
  className?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatLabel = (v) => String(v),
  className,
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  const getPercent = useCallback(
    (val: number) => ((val - min) / (max - min)) * 100,
    [min, max]
  );

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      const raw = min + percent * (max - min);
      return Math.round(raw / step) * step;
    },
    [min, max, step]
  );

  const handlePointerDown = useCallback(
    (handle: "min" | "max") => (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(handle);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const newVal = getValueFromPosition(e.clientX);
      if (dragging === "min") {
        onChange([Math.min(newVal, value[1] - step), value[1]]);
      } else {
        onChange([value[0], Math.max(newVal, value[0] + step)]);
      }
    },
    [dragging, getValueFromPosition, onChange, value, step]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        ref={trackRef}
        className="relative h-10 cursor-pointer touch-none select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Track */}
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-neutral-200" />

        {/* Active range */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary-500"
          style={{
            left: `${getPercent(value[0])}%`,
            right: `${100 - getPercent(value[1])}%`,
          }}
        />

        {/* Min handle */}
        <div
          className={cn(
            "absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary-500 bg-white shadow-sm transition-shadow",
            dragging === "min" ? "ring-4 ring-primary-100" : "hover:ring-4 hover:ring-primary-50"
          )}
          style={{ left: `${getPercent(value[0])}%` }}
          onPointerDown={handlePointerDown("min")}
        />

        {/* Max handle */}
        <div
          className={cn(
            "absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary-500 bg-white shadow-sm transition-shadow",
            dragging === "max" ? "ring-4 ring-primary-100" : "hover:ring-4 hover:ring-primary-50"
          )}
          style={{ left: `${getPercent(value[1])}%` }}
          onPointerDown={handlePointerDown("max")}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-neutral-500">
        <span>{formatLabel(value[0])}</span>
        <span>{formatLabel(value[1])}</span>
      </div>
    </div>
  );
}
