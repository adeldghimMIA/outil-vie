"use client";

import { Target, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GamificationObjective } from "@/types/gamification";

interface ObjectiveCardProps {
  objective: GamificationObjective;
}

export function ObjectiveCard({ objective }: ObjectiveCardProps) {
  const isCompleted = objective.completed_at !== null;
  const progress =
    objective.target_value !== null && objective.target_value > 0
      ? Math.min(100, (objective.current_value / objective.target_value) * 100)
      : 0;

  const deadlineDate = objective.deadline
    ? new Date(objective.deadline)
    : null;
  const isOverdue =
    deadlineDate !== null && !isCompleted && deadlineDate < new Date();

  return (
    <Card size="sm">
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            ) : (
              <Target className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                isCompleted && "line-through text-muted-foreground"
              )}
            >
              {objective.title}
            </span>
          </div>
        </div>

        {objective.target_value !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {objective.current_value} / {objective.target_value}{" "}
                {objective.unit ?? ""}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isCompleted ? "bg-emerald-500" : "bg-primary"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {deadlineDate && (
          <p
            className={cn(
              "text-xs",
              isOverdue
                ? "font-medium text-destructive"
                : "text-muted-foreground"
            )}
          >
            {isOverdue ? "En retard - " : "Echeance : "}
            {deadlineDate.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
