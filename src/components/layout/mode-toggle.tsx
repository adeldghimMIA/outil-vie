"use client";

import { useUIStore, type ActiveMode } from "@/stores/ui-store";
import { Briefcase, User, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const modes: {
  value: ActiveMode;
  label: string;
  icon: typeof Globe;
  activeClass: string;
}[] = [
  {
    value: "pro",
    label: "Pro",
    icon: Briefcase,
    activeClass:
      "bg-blue-600 text-white shadow-sm dark:bg-blue-500",
  },
  {
    value: "perso",
    label: "Perso",
    icon: User,
    activeClass:
      "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500",
  },
  {
    value: "global",
    label: "Global",
    icon: Globe,
    activeClass:
      "bg-purple-600 text-white shadow-sm dark:bg-purple-500",
  },
];

export function ModeToggle() {
  const activeMode = useUIStore((s) => s.activeMode);
  const setActiveMode = useUIStore((s) => s.setActiveMode);

  return (
    <div className="flex w-full rounded-lg border bg-muted/50 p-0.5">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => setActiveMode(mode.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all",
              isActive
                ? mode.activeClass
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact version for tight spaces (e.g. collapsed sidebar).
 * Shows only icons.
 */
export function ModeToggleCompact() {
  const activeMode = useUIStore((s) => s.activeMode);
  const setActiveMode = useUIStore((s) => s.setActiveMode);

  return (
    <div className="flex flex-col gap-1">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            title={mode.label}
            onClick={() => setActiveMode(mode.value)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-all",
              isActive
                ? mode.activeClass
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
