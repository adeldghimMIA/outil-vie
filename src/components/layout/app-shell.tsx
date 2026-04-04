"use client";

import { Banner } from "./banner";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

interface AppShellProps {
  children: React.ReactNode;
  bannerUrl?: string | null;
  userName?: string | null;
}

export function AppShell({ children, bannerUrl, userName }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          <Banner bannerUrl={bannerUrl} userName={userName} />
          <main className="flex-1">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
