import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, banner_url")
          .eq("id", user.id)
          .single();
        profile = data;
      }
    } catch {
      // Supabase not configured yet
    }
  }

  return (
    <AppShell
      bannerUrl={profile?.banner_url}
      userName={profile?.full_name}
    >
      {children}
    </AppShell>
  );
}
