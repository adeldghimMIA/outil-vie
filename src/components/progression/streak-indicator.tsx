"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  className,
}: StreakIndicatorProps) {
  const isActive = currentStreak > 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <Flame
          className={cn(
            "size-4",
            isActive
              ? "text-orange-500 animate-streak-pulse"
              : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "text-sm font-semibold",
            isActive ? "text-orange-500" : "text-muted-foreground"
          )}
        >
          {currentStreak}j
        </span>
      </div>
      {longestStreak > 0 && (
        <span className="text-xs text-muted-foreground">
          (max {longestStreak}j)
        </span>
      )}
    </div>
  );
}
