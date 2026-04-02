import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import { CalendarSection } from "@/components/calendar/calendar-section";
import { TaskPanel } from "@/components/tasks/task-panel";
import type { CalendarEvent, Task } from "@/types";

export default async function ProPage() {
  let events: CalendarEvent[] = [];
  let tasks: Task[] = [];

  try {
    const supabase = await createClient();

    // Fetch all events (pro view shows pro events detailed, perso events as gray)
    const [eventsResult, tasksResult] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("user_id", DEFAULT_USER_ID)
        .order("start_at", { ascending: true }),
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", DEFAULT_USER_ID)
        .eq("category", "pro")
        .neq("status", "cancelled")
        .order("priority", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false }),
    ]);

    events = (eventsResult.data as CalendarEvent[]) ?? [];
    tasks = (tasksResult.data as Task[]) ?? [];
  } catch {
    // Supabase not configured
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <CalendarSection category="pro" events={events} />
      </div>
      <aside className="space-y-4">
        <TaskPanel category="pro" tasks={tasks} />
      </aside>
    </div>
  );
}
