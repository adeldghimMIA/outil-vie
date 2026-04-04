"use client";

import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
}

function getGradientClasses(level: number): string {
  if (level >= 50) return "from-amber-400 to-yellow-600";
  if (level >= 30) return "from-purple-400 to-violet-600";
  if (level >= 20) return "from-blue-400 to-cyan-600";
  if (level >= 10) return "from-emerald-400 to-green-600";
  return "from-slate-400 to-slate-600";
}

const sizeMap = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
} as const;

const innerSizeMap = {
  sm: "size-6",
  md: "size-8",
  lg: "size-12",
} as const;

export function LevelBadge({ level, size = "md" }: LevelBadgeProps) {
  const gradient = getGradientClasses(level);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br p-0.5",
        gradient,
        sizeMap[size]
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-card font-bold",
          innerSizeMap[size]
        )}
      >
        {level}
      </div>
    </div>
  );
}
