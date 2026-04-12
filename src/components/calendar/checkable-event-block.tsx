"use client";

import { Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/types";

interface CheckableEventBlockProps {
  event: CalendarEvent;
  isChecked: boolean;
  onToggle: (eventId: string, date: string) => void;
  color: string;
  isSimplified: boolean;
}

export function CheckableEventBlock({
  event,
  isChecked,
  onToggle,
  color,
  isSimplified,
}: CheckableEventBlockProps) {
  const dateStr = parseISO(event.start_at).toISOString().slice(0, 10);

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    onToggle(event.id, dateStr);
  }

  if (isSimplified) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded px-1 text-[10px] leading-tight bg-gray-300/60 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400 border border-gray-300 dark:border-gray-600",
          isChecked && "border-emerald-500 opacity-60"
        )}
      >
        <button
          type="button"
          onClick={handleCheckboxClick}
          className={cn(
            "absolute top-0.5 left-0.5 z-20 flex size-3.5 items-center justify-center rounded-sm border transition-colors",
            isChecked
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-gray-400 bg-white/80 dark:bg-gray-800/80"
          )}
        >
          {isChecked && <Check className="size-2.5" />}
        </button>
        <span className="ml-4 truncate block">{event.title}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded px-1.5 py-0.5 text-[11px] leading-tight text-white shadow-sm transition-all",
        isChecked
          ? "ring-2 ring-emerald-500 opacity-70"
          : ""
      )}
      style={{
        backgroundColor: isChecked ? `${color}99` : color,
      }}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={handleCheckboxClick}
        className={cn(
          "absolute top-1 left-1 z-20 flex size-4 items-center justify-center rounded-sm border transition-colors",
          isChecked
            ? "border-emerald-400 bg-emerald-500 text-white"
            : "border-white/60 bg-white/20 hover:bg-white/40"
        )}
      >
        {isChecked && <Check className="size-3" />}
      </button>

      {/* Content */}
      <div className="ml-5">
        <span
          className={cn(
            "font-medium truncate block",
            isChecked && "line-through"
          )}
        >
          {event.title}
        </span>
        {!event.all_day && (
          <span className="text-[9px] opacity-80 truncate block">
            {format(parseISO(event.start_at), "HH:mm")} -{" "}
            {format(parseISO(event.end_at), "HH:mm")}
          </span>
        )}
        {event.is_urgent && (
          <span className="inline-block mt-0.5 text-[9px] bg-white/20 rounded px-0.5">
            urgent
          </span>
        )}
      </div>
    </div>
  );
}
