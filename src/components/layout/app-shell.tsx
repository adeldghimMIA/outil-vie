"use client";

import { Banner } from "./banner";
import { TabNavigation } from "./tab-navigation";

interface AppShellProps {
  children: React.ReactNode;
  bannerUrl?: string | null;
  userName?: string | null;
}

export function AppShell({ children, bannerUrl, userName }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-4 sm:p-6">
      <Banner bannerUrl={bannerUrl} userName={userName} />
      <TabNavigation />
      <main className="flex-1">{children}</main>
    </div>
  );
}
