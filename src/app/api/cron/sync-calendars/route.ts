import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import { getValidAccessToken } from "@/lib/microsoft/auth";
import {
  fetchOutlookEvents,
  mapOutlookEventToLocal,
} from "@/lib/microsoft/graph";

export async function GET(request: NextRequest) {
  // Verify the cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find the Microsoft connected account for the default user
  const { data: account, error: accountError } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", DEFAULT_USER_ID)
    .eq("provider", "microsoft")
    .maybeSingle();

  if (accountError) {
    console.error("Cron: failed to fetch connected account:", accountError);
    return NextResponse.json(
      { error: accountError.message },
      { status: 500 }
    );
  }

  if (!account) {
    console.log("Cron: no Microsoft account connected, skipping sync");
    return NextResponse.json({ message: "No Microsoft account connected" });
  }

  try {
    const accessToken = await getValidAccessToken(account.id);

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

    // Fetch existing Microsoft events in range
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
      if (outlookEvent.isCancelled) continue;

      const localData = mapOutlookEventToLocal(outlookEvent);
      const existing = existingMap.get(outlookEvent.id);

      if (!existing) {
        const { error } = await supabase.from("events").insert({
          user_id: DEFAULT_USER_ID,
          ...localData,
        });
        if (!error) inserted++;
      } else {
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

    console.log(
      `Cron sync complete: ${inserted} inserted, ${updated} updated out of ${outlookEvents.length} Outlook events`
    );

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      total: outlookEvents.length,
    });
  } catch (err) {
    console.error("Cron sync error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
