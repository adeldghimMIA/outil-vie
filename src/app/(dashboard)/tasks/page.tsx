import { createClient } from "@/lib/supabase/server";
import { TaskPanel } from "@/components/tasks/task-panel";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import type { Task } from "@/types";

export default async function TasksPage() {
  let tasks: Task[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", DEFAULT_USER_ID)
      .neq("status", "cancelled")
      .order("priority", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false });
    tasks = (data as Task[]) ?? [];
  } catch {
    // Supabase not configured
  }

  return (
    <div className="space-y-4">
      <TaskPanel category={null} tasks={tasks} />
    </div>
  );
}
