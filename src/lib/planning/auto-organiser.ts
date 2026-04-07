import { addMinutes, isBefore, isAfter, isEqual } from "date-fns";
import type { Task, CalendarEvent } from "@/types";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ScheduleSlot {
  taskId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  priority: number;
  estimatedMinutes: number;
  category: "pro" | "perso";
}

export interface AutoOrganiseResult {
  scheduled: ScheduleSlot[];
  unschedulable: Task[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface FreeSlot {
  start: Date;
  end: Date;
}

const BUFFER_MINUTES = 10;
const DEFAULT_ESTIMATED_MINUTES = 30;

/**
 * Build sorted busy intervals from calendar events.
 * Each interval is extended by BUFFER_MINUTES at the end to enforce a gap.
 */
function buildBusyIntervals(events: CalendarEvent[]): FreeSlot[] {
  const intervals: FreeSlot[] = events.map((e) => ({
    start: new Date(e.start_at),
    end: addMinutes(new Date(e.end_at), BUFFER_MINUTES),
  }));

  // Sort by start time
  intervals.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Merge overlapping intervals
  const merged: FreeSlot[] = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (last && (isBefore(interval.start, last.end) || isEqual(interval.start, last.end))) {
      // Overlapping or adjacent — extend
      if (isAfter(interval.end, last.end)) {
        last.end = interval.end;
      }
    } else {
      merged.push({ start: interval.start, end: interval.end });
    }
  }

  return merged;
}

/**
 * Compute free slots between `from` and `to`, excluding busy intervals.
 */
function computeFreeSlots(from: Date, to: Date, busy: FreeSlot[]): FreeSlot[] {
  if (!isBefore(from, to)) return [];

  const free: FreeSlot[] = [];
  let cursor = from;

  for (const b of busy) {
    // If busy interval ends before our cursor, skip
    if (!isAfter(b.end, cursor)) continue;

    // If busy interval starts after our end boundary, stop
    if (!isBefore(b.start, to)) break;

    // If there is a gap between cursor and the busy block start, that's free
    if (isAfter(b.start, cursor)) {
      const slotEnd = isBefore(b.start, to) ? b.start : to;
      free.push({ start: cursor, end: slotEnd });
    }

    // Move cursor past this busy block
    cursor = isAfter(b.end, cursor) ? b.end : cursor;
  }

  // Remaining time after last busy block
  if (isBefore(cursor, to)) {
    free.push({ start: cursor, end: to });
  }

  return free;
}

/**
 * Sort tasks for scheduling:
 * 1. Priority ascending (1 = highest first)
 * 2. Due date ascending (closest first, nulls last)
 * 3. Estimated minutes ascending (shortest first for tie-breaking)
 */
function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Priority
    if (a.priority !== b.priority) return a.priority - b.priority;

    // Due date (nulls last)
    if (a.due_date && b.due_date) {
      const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (diff !== 0) return diff;
    } else if (a.due_date && !b.due_date) {
      return -1;
    } else if (!a.due_date && b.due_date) {
      return 1;
    }

    // Estimated minutes (shortest first)
    const aMin = a.estimated_minutes ?? DEFAULT_ESTIMATED_MINUTES;
    const bMin = b.estimated_minutes ?? DEFAULT_ESTIMATED_MINUTES;
    return aMin - bMin;
  });
}

/**
 * Compute the duration in minutes between two dates.
 */
function durationMinutes(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 60_000;
}

/**
 * Try to place a task in one of the free slots, optionally preferring a time
 * of day. Returns the index of the chosen free slot and the ScheduleSlot, or
 * null if no slot fits.
 *
 * When a task is placed, the free slot is split in-place (the consumed portion
 * is removed and any leftover time remains available).
 */
function tryPlace(
  task: Task,
  freeSlots: FreeSlot[],
  preferBefore: Date | null,
  preferAfterOrEqual: Date | null,
): ScheduleSlot | null {
  const est = task.estimated_minutes ?? DEFAULT_ESTIMATED_MINUTES;

  // First pass: try to honour energy preference
  if (preferBefore || preferAfterOrEqual) {
    for (let i = 0; i < freeSlots.length; i++) {
      const slot = freeSlots[i];
      const slotMinutes = durationMinutes(slot.start, slot.end);
      if (slotMinutes < est) continue;

      // Check energy preference
      if (preferBefore && !isBefore(slot.start, preferBefore)) continue;
      if (preferAfterOrEqual && isBefore(slot.start, preferAfterOrEqual)) continue;

      return placeInSlot(task, est, freeSlots, i);
    }
  }

  // Second pass: fall back to first available slot
  for (let i = 0; i < freeSlots.length; i++) {
    const slot = freeSlots[i];
    const slotMinutes = durationMinutes(slot.start, slot.end);
    if (slotMinutes < est) continue;

    return placeInSlot(task, est, freeSlots, i);
  }

  return null;
}

/**
 * Place a task at the beginning of `freeSlots[index]`, shrink or remove
 * the slot, and add a buffer gap after the task.
 */
function placeInSlot(
  task: Task,
  estimatedMinutes: number,
  freeSlots: FreeSlot[],
  index: number,
): ScheduleSlot {
  const slot = freeSlots[index];
  const startTime = slot.start;
  const endTime = addMinutes(startTime, estimatedMinutes);

  // Consume the slot: task duration + buffer
  const newSlotStart = addMinutes(endTime, BUFFER_MINUTES);
  if (isBefore(newSlotStart, slot.end)) {
    slot.start = newSlotStart;
  } else {
    // Entire slot consumed
    freeSlots.splice(index, 1);
  }

  return {
    taskId: task.id,
    title: task.title,
    startTime,
    endTime,
    priority: task.priority,
    estimatedMinutes,
    category: task.category,
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Auto-organise unscheduled tasks into available time slots for the day.
 *
 * @param tasks      Unscheduled tasks to plan
 * @param events     Existing fixed calendar events
 * @param startFrom  Current time — scheduling starts from now
 * @param dayEnd     End of the work day (default: same day at 20:00)
 */
export function autoOrganiseDay(
  tasks: Task[],
  events: CalendarEvent[],
  startFrom: Date,
  dayEnd?: Date,
): AutoOrganiseResult {
  // Default dayEnd to 20:00 on the same day as startFrom
  const end =
    dayEnd ??
    new Date(
      startFrom.getFullYear(),
      startFrom.getMonth(),
      startFrom.getDate(),
      20,
      0,
      0,
      0,
    );

  // If we are already past the end of the day, nothing to schedule
  if (!isBefore(startFrom, end)) {
    return { scheduled: [], unschedulable: [...tasks] };
  }

  const busy = buildBusyIntervals(events);
  const freeSlots = computeFreeSlots(startFrom, end, busy);
  const sorted = sortTasks(tasks);

  const noon = new Date(
    startFrom.getFullYear(),
    startFrom.getMonth(),
    startFrom.getDate(),
    12,
    0,
    0,
    0,
  );

  const scheduled: ScheduleSlot[] = [];
  const unschedulable: Task[] = [];

  for (const task of sorted) {
    // Determine energy preference
    let preferBefore: Date | null = null;
    let preferAfterOrEqual: Date | null = null;

    if (task.energy_level === "high") {
      preferBefore = noon; // prefer morning
    } else if (task.energy_level === "low") {
      preferAfterOrEqual = noon; // prefer afternoon
    }

    const result = tryPlace(task, freeSlots, preferBefore, preferAfterOrEqual);
    if (result) {
      scheduled.push(result);
    } else {
      unschedulable.push(task);
    }
  }

  return { scheduled, unschedulable };
}
