"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CalendarEvent, Task } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR; // 15 hours
const HOUR_HEIGHT_PX = 64; // height of each hour slot

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTopAndHeight(startAt: string, endAt: string): { top: number; height: number } {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  const timelineStartMinutes = START_HOUR * 60;
  const timelineEndMinutes = END_HOUR * 60;

  // Clamp to timeline bounds
  const clampedStart = Math.max(startMinutes, timelineStartMinutes);
  const clampedEnd = Math.min(endMinutes, timelineEndMinutes);

  const offsetMinutes = clampedStart - timelineStartMinutes;
  const durationMinutes = Math.max(clampedEnd - clampedStart, 15); // min 15min block

  const top = (offsetMinutes / 60) * HOUR_HEIGHT_PX;
  const height = (durationMinutes / 60) * HOUR_HEIGHT_PX;

  return { top, height };
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pro: {
    bg: "bg-blue-500/15 dark:bg-blue-400/15",
    border: "border-blue-500 dark:border-blue-400",
    text: "text-blue-700 dark:text-blue-300",
  },
  perso: {
    bg: "bg-emerald-500/15 dark:bg-emerald-400/15",
    border: "border-emerald-500 dark:border-emerald-400",
    text: "text-emerald-700 dark:text-emerald-300",
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DayTimelineProps {
  events: CalendarEvent[];
  scheduledTasks: Task[];
  date: Date;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DayTimeline({ events, scheduledTasks, date }: DayTimelineProps) {
  const hours = useMemo(
    () => Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i),
    []
  );

  return (
    <div className="relative">
      {/* Header */}
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        Planning du {format(date, "d MMMM", { locale: fr })}
      </h3>

      {/* Timeline grid */}
      <div className="relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT_PX }}>
        {/* Hour labels and lines */}
        {hours.map((hour) => {
          const top = (hour - START_HOUR) * HOUR_HEIGHT_PX;
          return (
            <div key={hour} className="absolute left-0 right-0" style={{ top }}>
              <div className="flex items-start gap-2">
                <span className="w-10 shrink-0 -translate-y-1/2 text-right text-xs text-muted-foreground">
                  {String(hour).padStart(2, "0")}:00
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
          );
        })}

        {/* Event blocks */}
        {events.map((event) => {
          const { top, height } = getTopAndHeight(event.start_at, event.end_at);
          const colors = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.pro;

          return (
            <div
              key={event.id}
              className={cn(
                "absolute left-14 right-2 rounded-md border-l-3 px-2 py-1 overflow-hidden",
                colors.bg,
                colors.border,
                colors.text
              )}
              style={{ top, height, minHeight: 24 }}
            >
              <p className="truncate text-xs font-medium">{event.title}</p>
              {height >= 40 && (
                <p className="truncate text-[10px] opacity-70">
                  {format(new Date(event.start_at), "HH:mm")} -{" "}
                  {format(new Date(event.end_at), "HH:mm")}
                </p>
              )}
            </div>
          );
        })}

        {/* Scheduled task blocks (dashed border) */}
        {scheduledTasks.map((task) => {
          if (!task.scheduled_start || !task.scheduled_end) return null;
          const { top, height } = getTopAndHeight(task.scheduled_start, task.scheduled_end);
          const colors = CATEGORY_COLORS[task.category] ?? CATEGORY_COLORS.pro;

          return (
            <div
              key={task.id}
              className={cn(
                "absolute left-14 right-2 rounded-md border border-dashed px-2 py-1 overflow-hidden",
                colors.bg,
                colors.border,
                colors.text
              )}
              style={{ top, height, minHeight: 24 }}
            >
              <p className="truncate text-xs font-medium">{task.title}</p>
              {height >= 40 && (
                <p className="truncate text-[10px] opacity-70">
                  {format(new Date(task.scheduled_start), "HH:mm")} -{" "}
                  {format(new Date(task.scheduled_end), "HH:mm")}
                  {task.estimated_minutes ? ` · ${task.estimated_minutes}min` : ""}
                </p>
              )}
            </div>
          );
        })}

        {/* Current time indicator */}
        <CurrentTimeLine />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Current time red line
// ---------------------------------------------------------------------------

function CurrentTimeLine() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const timelineStart = START_HOUR * 60;
  const timelineEnd = END_HOUR * 60;

  if (minutes < timelineStart || minutes > timelineEnd) return null;

  const top = ((minutes - timelineStart) / 60) * HOUR_HEIGHT_PX;

  return (
    <div className="absolute left-10 right-0 z-10 flex items-center" style={{ top }}>
      <div className="size-2 rounded-full bg-red-500" />
      <div className="h-px flex-1 bg-red-500" />
    </div>
  );
}
