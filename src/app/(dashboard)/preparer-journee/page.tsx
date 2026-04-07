import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DayTimeline } from "@/components/planner/day-timeline";
import { UnscheduledPanel } from "@/components/planner/unscheduled-panel";
import { AutoOrganiserButton } from "./auto-organiser-button";
import { getEventsByDate } from "@/app/actions/events";
import { getTasksForToday } from "@/app/actions/tasks";
import { DEFAULT_USER_ID } from "@/lib/default-user";

export default async function PreparerJourneePage() {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const todayLabel = format(today, "EEEE d MMMM yyyy", { locale: fr });

  // Fetch today's events and tasks in parallel
  const [events, tasks] = await Promise.all([
    getEventsByDate(DEFAULT_USER_ID, todayStr),
    getTasksForToday(DEFAULT_USER_ID),
  ]);

  // Filter out task_block events so they don't duplicate scheduled task blocks
  const calendarEvents = events.filter((e) => e.event_type !== "task_block");

  // Separate scheduled vs unscheduled tasks
  const scheduledTasks = tasks.filter(
    (t) => t.scheduled_start && t.scheduled_end
  );
  const unscheduledTasks = tasks.filter(
    (t) => !t.scheduled_start || !t.scheduled_end
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 text-primary" />
          <div>
            <h1 className="text-lg font-bold">Preparer ma journee</h1>
            <p className="text-sm capitalize text-muted-foreground">{todayLabel}</p>
          </div>
        </div>

        <AutoOrganiserButton />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Left: Day Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-260px)]">
              <DayTimeline
                events={calendarEvents}
                scheduledTasks={scheduledTasks}
                date={today}
              />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Unscheduled tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">A planifier</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-260px)]">
              <UnscheduledPanel tasks={unscheduledTasks} />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
