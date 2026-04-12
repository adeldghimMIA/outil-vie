"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_ID } from "@/lib/default-user";

/**
 * Toggle an event as completed for a given date.
 * - If already completed: deletes the activity_session, removes XP.
 * - If not completed: inserts an activity_session, awards XP.
 */
export async function toggleEventCompletion(
  eventId: string,
  date: string
): Promise<{ checked: boolean; xpAwarded: number }> {
  const supabase = await createClient();

  // Check if an activity_session already exists for this event + date
  const { data: existing, error: fetchError } = await supabase
    .from("activity_sessions")
    .select("id")
    .eq("user_id", DEFAULT_USER_ID)
    .eq("event_id", eventId)
    .eq("session_date", date)
    .maybeSingle();

  if (fetchError) {
    throw new Error(
      `Erreur lors de la verification de la session : ${fetchError.message}`
    );
  }

  if (existing) {
    // Already checked: uncheck it
    const { error: deleteError } = await supabase
      .from("activity_sessions")
      .delete()
      .eq("id", existing.id);

    if (deleteError) {
      throw new Error(
        `Erreur lors de la suppression de la session : ${deleteError.message}`
      );
    }

    // Remove the associated XP event
    await supabase
      .from("xp_events")
      .delete()
      .eq("user_id", DEFAULT_USER_ID)
      .eq("source_type", "event_checked")
      .eq("source_id", eventId)
      .gte("created_at", `${date}T00:00:00`)
      .lte("created_at", `${date}T23:59:59`);

    revalidatePath("/", "layout");
    return { checked: false, xpAwarded: -25 };
  }

  // Not checked yet: create session
  const { error: insertError } = await supabase
    .from("activity_sessions")
    .insert({
      user_id: DEFAULT_USER_ID,
      activity_id: eventId,
      event_id: eventId,
      session_date: date,
      duration_minutes: null,
      notes: "Checked from daily calendar",
    });

  if (insertError) {
    throw new Error(
      `Erreur lors de la creation de la session : ${insertError.message}`
    );
  }

  // Award 25 XP
  // Try to find the event to get its axis_id via activity_id
  const { data: eventData } = await supabase
    .from("events")
    .select("activity_id")
    .eq("id", eventId)
    .maybeSingle();

  let axisId: string | null = null;
  if (eventData?.activity_id) {
    const { data: activity } = await supabase
      .from("activities")
      .select("axis_id")
      .eq("id", eventData.activity_id)
      .maybeSingle();
    axisId = activity?.axis_id ?? null;
  }

  const { error: xpError } = await supabase.from("xp_events").insert({
    user_id: DEFAULT_USER_ID,
    axis_id: axisId,
    source_type: "event_checked",
    source_id: eventId,
    xp_amount: 25,
    description: "Evenement complete depuis le calendrier",
    metadata: { date },
  });

  if (xpError) {
    throw new Error(
      `Erreur lors de l'attribution d'XP : ${xpError.message}`
    );
  }

  revalidatePath("/", "layout");
  return { checked: true, xpAwarded: 25 };
}

/**
 * Get all event IDs that have been completed for a given date.
 */
export async function getDailyCompletions(
  userId: string,
  date: string
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_sessions")
    .select("event_id")
    .eq("user_id", userId)
    .eq("session_date", date)
    .not("event_id", "is", null);

  if (error) {
    throw new Error(
      `Erreur lors de la recuperation des completions : ${error.message}`
    );
  }

  return (data ?? [])
    .map((row: { event_id: string | null }) => row.event_id)
    .filter((id): id is string => id !== null);
}
