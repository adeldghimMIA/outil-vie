"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  FolderKanban,
  Trophy,
  Sparkles,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { useUIStore } from "@/stores/ui-store";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import { createClient } from "@/lib/supabase/client";
import { getLevelProgress } from "@/lib/gamification/level-calculator";

const mainNav = [
  { href: "/global", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendrier", icon: Calendar },
  { href: "/tasks", label: "Taches", icon: CheckSquare },
  { href: "/projects", label: "Projets", icon: FolderKanban },
] as const;

const persoNav = [
  { href: "/progression", label: "Progression", icon: Trophy, color: "text-amber-500" },
] as const;

const outilsNav = [
  { href: "/preparer-journee", label: "Preparer ma journee", icon: Sparkles },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const activeMode = useUIStore((s) => s.activeMode);
  const [levelInfo, setLevelInfo] = useState({ level: 1, progress: 0 });

  useEffect(() => {
    let cancelled = false;

    async function fetchXP() {
      try {
        const supabase = createClient();
        const { data: levels } = await supabase
          .from("user_levels")
          .select("total_xp")
          .eq("user_id", DEFAULT_USER_ID);

        if (cancelled) return;

        const totalXP =
          levels?.reduce((sum, l) => sum + ((l.total_xp as number) ?? 0), 0) ?? 0;
        const info = getLevelProgress(totalXP);
        setLevelInfo({ level: info.level, progress: info.progress });
      } catch {
        // Non-blocking: keep default level 1
      }
    }

    fetchXP();
    return () => {
      cancelled = true;
    };
  }, []);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const showPerso = activeMode !== "pro";

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="space-y-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/global" />} tooltip="Outil de Vie">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-emerald-500 text-white">
                <LayoutDashboard className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Outil de Vie</span>
                <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0">
                  Niveau {levelInfo.level}
                </Badge>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 group-data-[collapsible=icon]:hidden space-y-2">
          <ModeToggle />
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Niveau {levelInfo.level}</span>
              <span>{Math.round(levelInfo.progress)}%</span>
            </div>
            <Progress value={levelInfo.progress}>
              <span className="sr-only">{Math.round(levelInfo.progress)}% progression</span>
            </Progress>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Main navigation */}
        <SidebarGroup>
          <SidebarMenu>
            {mainNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive(item.href)}
                  tooltip={item.label}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Perso - hidden when mode is "pro" */}
        {showPerso && (
          <SidebarGroup>
            <SidebarGroupLabel>PERSO</SidebarGroupLabel>
            <SidebarMenu>
              {persoNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon className={`size-4 ${item.color}`} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarSeparator />

        {/* Outils */}
        <SidebarGroup>
          <SidebarGroupLabel>OUTILS</SidebarGroupLabel>
          <SidebarMenu>
            {outilsNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={isActive(item.href)}
                  tooltip={item.label}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/settings" />}
              isActive={isActive("/settings")}
              tooltip="Parametres"
            >
              <Settings className="size-4" />
              <span>Parametres</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
