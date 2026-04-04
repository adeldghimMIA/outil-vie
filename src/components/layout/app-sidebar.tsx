"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  FolderKanban,
  Briefcase,
  User,
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
import { ModeToggle } from "@/components/layout/mode-toggle";

const mainNav = [
  { href: "/global", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendrier", icon: Calendar },
  { href: "/tasks", label: "Taches", icon: CheckSquare },
  { href: "/projects", label: "Projets", icon: FolderKanban },
] as const;

const vieProNav = [
  { href: "/pro", label: "Vue Pro", icon: Briefcase, color: "text-blue-500" },
] as const;

const viePersoNav = [
  { href: "/perso", label: "Vue Perso", icon: User, color: "text-emerald-500" },
  { href: "/progression", label: "Progression", icon: Trophy, color: "text-amber-500" },
] as const;

const outilsNav = [
  { href: "/preparer-journee", label: "Preparer ma journee", icon: Sparkles },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

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
                  Niveau 1
                </Badge>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 group-data-[collapsible=icon]:hidden">
          <ModeToggle />
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

        {/* Vie Pro */}
        <SidebarGroup>
          <SidebarGroupLabel>VIE PRO</SidebarGroupLabel>
          <SidebarMenu>
            {vieProNav.map((item) => (
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

        {/* Vie Perso */}
        <SidebarGroup>
          <SidebarGroupLabel>VIE PERSO</SidebarGroupLabel>
          <SidebarMenu>
            {viePersoNav.map((item) => (
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
