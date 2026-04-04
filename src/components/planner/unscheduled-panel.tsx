"use client";

import { Clock, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority } from "@/types";

// ---------------------------------------------------------------------------
// Priority helpers
// ---------------------------------------------------------------------------

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; variant: "destructive" | "default" | "secondary" | "outline"; className?: string }
> = {
  1: { label: "P1", variant: "destructive" },
  2: { label: "P2", variant: "default", className: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600" },
  3: { label: "P3", variant: "secondary" },
  4: { label: "P4", variant: "outline" },
  5: { label: "P5", variant: "outline" },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UnscheduledPanelProps {
  tasks: Task[];
  onScheduleTask?: (taskId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UnscheduledPanel({ tasks, onScheduleTask }: UnscheduledPanelProps) {
  // Sort by priority (1=highest first)
  const sorted = [...tasks].sort((a, b) => a.priority - b.priority);

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        Taches non planifiees ({sorted.length})
      </h3>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucune tache a planifier
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((task) => {
            const priorityCfg = PRIORITY_CONFIG[task.priority];

            return (
              <li
                key={task.id}
                className={cn(
                  "group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors",
                  onScheduleTask && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => onScheduleTask?.(task.id)}
              >
                {/* Priority flag */}
                <Flag className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant={priorityCfg.variant}
                      className={priorityCfg.className}
                    >
                      {priorityCfg.label}
                    </Badge>

                    {task.estimated_minutes != null && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {task.estimated_minutes} min
                      </span>
                    )}

                    <Badge variant="outline" className="text-[10px]">
                      {task.category === "pro" ? "Pro" : "Perso"}
                    </Badge>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
