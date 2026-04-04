import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import { GlobalDashboard } from "./global-dashboard";
import type { CalendarEvent, Task } from "@/types";

export default async function GlobalPage() {
  let events: CalendarEvent[] = [];
  let tasks: Task[] = [];

  try {
    const supabase = await createClient();

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
        .neq("status", "cancelled")
        .order("priority", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false }),
    ]);

    events = (eventsResult.data as CalendarEvent[]) ?? [];
    tasks = (tasksResult.data as Task[]) ?? [];
  } catch {
    // Supabase not configured
  }

  return <GlobalDashboard events={events} tasks={tasks} />;
}
