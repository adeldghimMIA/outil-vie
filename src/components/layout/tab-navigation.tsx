"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Briefcase, User, LayoutGrid, Settings } from "lucide-react";

const tabs = [
  { href: "/pro", label: "Vie Pro", icon: Briefcase, color: "text-blue-500" },
  { href: "/perso", label: "Vie Perso", icon: User, color: "text-emerald-500" },
  { href: "/global", label: "Global", icon: LayoutGrid, color: "text-purple-500" },
] as const;

export function TabNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4", isActive && tab.color)} />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
      <Link
        href="/settings"
        className={cn(
          "ml-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
          pathname.startsWith("/settings")
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Settings className="h-4 w-4" />
      </Link>
    </nav>
  );
}
