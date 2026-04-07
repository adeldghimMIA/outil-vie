"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import {
  getMicrosoftAccount,
  getValidAccessToken,
} from "@/lib/microsoft/auth";
import {
  fetchOutlookEvents,
  mapOutlookEventToLocal,
} from "@/lib/microsoft/graph";

// ---------------------------------------------------------------------------
// Sync Outlook calendar events into our local events table
// ---------------------------------------------------------------------------

export async function syncOutlookCalendar(): Promise<{
  success: boolean;
  message: string;
  inserted: number;
  updated: number;
}> {
  try {
    const account = await getMicrosoftAccount();

    if (!account) {
      return {
        success: false,
        message: "Aucun compte Microsoft connecte",
        inserted: 0,
        updated: 0,
      };
    }

    // Get a valid (possibly refreshed) access token
    const accessToken = await getValidAccessToken(account.id);

    // Fetch Outlook events for the next 30 days
    const now = new Date();
    const startDate = now.toISOString();
    const endDate = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const outlookEvents = await fetchOutlookEvents(
      accessToken,
      startDate,
      endDate
    );

    const supabase = createAdminClient();

    // Fetch all existing Microsoft-sourced events in the date range so we can
    // diff against them efficiently.
    const { data: existingEvents } = await supabase
      .from("events")
      .select("id, external_id, updated_at")
      .eq("user_id", DEFAULT_USER_ID)
      .eq("external_source", "microsoft")
      .gte("start_at", startDate)
      .lte("start_at", endDate);

    const existingMap = new Map(
      (existingEvents ?? []).map((e) => [e.external_id, e])
    );

    let inserted = 0;
    let updated = 0;

    for (const outlookEvent of outlookEvents) {
      // Skip cancelled events
      if (outlookEvent.isCancelled) continue;

      const localData = mapOutlookEventToLocal(outlookEvent);
      const existing = existingMap.get(outlookEvent.id);

      if (!existing) {
        // New event -- insert
        const { error } = await supabase.from("events").insert({
          user_id: DEFAULT_USER_ID,
          ...localData,
        });

        if (!error) inserted++;
      } else {
        // Existing event -- update if Outlook's lastModified is newer
        const { error } = await supabase
          .from("events")
          .update({
            title: localData.title,
            description: localData.description,
            location: localData.location,
            start_at: localData.start_at,
            end_at: localData.end_at,
            all_day: localData.all_day,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (!error) updated++;
      }
    }

    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    revalidatePath("/settings");

    return {
      success: true,
      message: `Synchronisation terminee: ${inserted} ajoute(s), ${updated} mis a jour`,
      inserted,
      updated,
    };
  } catch (err) {
    console.error("Outlook sync error:", err);
    const message =
      err instanceof Error ? err.message : "Erreur inconnue";
    return {
      success: false,
      message,
      inserted: 0,
      updated: 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Disconnect the Microsoft account
// ---------------------------------------------------------------------------

export async function disconnectOutlook(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("connected_accounts")
      .delete()
      .eq("user_id", DEFAULT_USER_ID)
      .eq("provider", "microsoft");

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/settings");

    return { success: true, message: "Compte Microsoft deconnecte" };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur inconnue";
    return { success: false, message };
  }
}

// ---------------------------------------------------------------------------
// Check whether a Microsoft account is connected
// ---------------------------------------------------------------------------

export async function getOutlookConnectionStatus(): Promise<{
  connected: boolean;
  provider: string | null;
}> {
  try {
    const account = await getMicrosoftAccount();
    return {
      connected: !!account,
      provider: account ? "microsoft" : null,
    };
  } catch {
    return { connected: false, provider: null };
  }
}
