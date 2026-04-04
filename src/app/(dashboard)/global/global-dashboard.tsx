"use client";

import { useMemo } from "react";
import { CalendarSection } from "@/components/calendar/calendar-section";
import { TaskPanel } from "@/components/tasks/task-panel";
import { useUIStore } from "@/stores/ui-store";
import type { CalendarEvent, EventCategory, Task } from "@/types";

interface GlobalDashboardProps {
  events: CalendarEvent[];
  tasks: Task[];
}

export function GlobalDashboard({ events, tasks }: GlobalDashboardProps) {
  const activeMode = useUIStore((s) => s.activeMode);

  // Derive the category filter from the active mode
  const categoryFilter: EventCategory | null =
    activeMode === "global" ? null : activeMode;

  // Filter tasks client-side based on the active mode
  const filteredTasks = useMemo(() => {
    if (activeMode === "global") return tasks;
    return tasks.filter((t) => t.category === activeMode);
  }, [tasks, activeMode]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <CalendarSection category={categoryFilter} events={events} />
      </div>
      <aside className="space-y-4">
        <TaskPanel category={categoryFilter} tasks={filteredTasks} />
      </aside>
    </div>
  );
}
