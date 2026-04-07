"use server";

import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";

import { DEFAULT_USER_ID } from "@/lib/default-user";
import { autoOrganiseDay } from "@/lib/planning/auto-organiser";
import { getEventsByDate, createEvent } from "@/app/actions/events";
import { getTasksForToday, updateTask } from "@/app/actions/tasks";
import type { Task } from "@/types";

// ---------------------------------------------------------------------------
// Auto-organise today
// ---------------------------------------------------------------------------

export async function autoOrganiseToday(): Promise<{
  scheduledCount: number;
  unschedulableCount: number;
}> {
  const TIMEZONE = "Europe/Paris";

  // Current time in Europe/Paris
  const nowParis = toZonedTime(new Date(), TIMEZONE);
  const todayStr = format(nowParis, "yyyy-MM-dd");

  // Fetch events and tasks in parallel
  const [events, tasks] = await Promise.all([
    getEventsByDate(DEFAULT_USER_ID, todayStr),
    getTasksForToday(DEFAULT_USER_ID),
  ]);

  // Only schedule truly unscheduled tasks
  const unscheduledTasks = tasks.filter(
    (t: Task) => !t.scheduled_start || !t.scheduled_end,
  );

  if (unscheduledTasks.length === 0) {
    return { scheduledCount: 0, unschedulableCount: 0 };
  }

  // Build a lookup map so we can retrieve task category later
  const taskMap = new Map<string, Task>();
  for (const t of unscheduledTasks) {
    taskMap.set(t.id, t);
  }

  // Run the algorithm
  const result = autoOrganiseDay(unscheduledTasks, events, nowParis);

  // Persist each scheduled slot
  const updates = result.scheduled.map(async (slot) => {
    const task = taskMap.get(slot.taskId);
    const category = task?.category ?? "pro";

    // 1. Update the task with scheduled times
    await updateTask(slot.taskId, {
      scheduled_start: slot.startTime.toISOString(),
      scheduled_end: slot.endTime.toISOString(),
      status: "scheduled",
    });

    // 2. Create a task_block event on the calendar
    await createEvent({
      title: slot.title,
      description: null,
      location: null,
      color: null,
      category,
      event_type: "task_block",
      start_at: slot.startTime.toISOString(),
      end_at: slot.endTime.toISOString(),
      all_day: false,
      recurrence: "none",
      recurrence_rule: null,
      recurrence_end_at: null,
      parent_event_id: null,
      is_urgent: false,
      reminder_minutes: [],
      activity_id: null,
      external_id: slot.taskId,
      external_source: "auto_organiser",
    });
  });

  await Promise.all(updates);

  revalidatePath("/preparer-journee");
  revalidatePath("/");

  return {
    scheduledCount: result.scheduled.length,
    unschedulableCount: result.unschedulable.length,
  };
}
