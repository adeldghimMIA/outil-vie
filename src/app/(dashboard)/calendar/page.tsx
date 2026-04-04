import { createClient } from "@/lib/supabase/server";
import { CalendarSection } from "@/components/calendar/calendar-section";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import type { CalendarEvent } from "@/types";

export default async function CalendarPage() {
  let events: CalendarEvent[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", DEFAULT_USER_ID)
      .order("start_at");
    events = (data as CalendarEvent[]) ?? [];
  } catch {
    // Supabase not configured
  }

  return (
    <div className="space-y-4">
      <CalendarSection category={null} events={events} />
    </div>
  );
}
