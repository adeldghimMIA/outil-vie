// ---------------------------------------------------------------------------
// Microsoft Graph API helpers
// ---------------------------------------------------------------------------

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

// ---------------------------------------------------------------------------
// Outlook event shape (subset of fields we care about)
// ---------------------------------------------------------------------------

export interface OutlookEvent {
  id: string;
  subject: string;
  bodyPreview: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  isAllDay: boolean;
  location?: { displayName?: string };
  lastModifiedDateTime: string;
  isCancelled?: boolean;
}

// ---------------------------------------------------------------------------
// Fetch calendar events from Outlook for a given date range
// ---------------------------------------------------------------------------

export async function fetchOutlookEvents(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<OutlookEvent[]> {
  const params = new URLSearchParams({
    startDateTime: startDate,
    endDateTime: endDate,
    $top: "500",
    $select:
      "id,subject,bodyPreview,start,end,isAllDay,location,lastModifiedDateTime,isCancelled",
    $orderby: "start/dateTime",
  });

  const url = `${GRAPH_BASE}/me/calendarView?${params.toString()}`;

  const events: OutlookEvent[] = [];
  let nextLink: string | null = url;

  while (nextLink) {
    const res: Response = await fetch(nextLink, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: 'outlook.timezone="UTC"',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Graph calendarView failed (${res.status}): ${text}`);
    }

    const json: { value?: OutlookEvent[]; "@odata.nextLink"?: string } = await res.json();
    const page = (json.value ?? []) as OutlookEvent[];
    events.push(...page);

    nextLink = json["@odata.nextLink"] ?? null;
  }

  return events;
}

// ---------------------------------------------------------------------------
// Map an Outlook event to the shape expected by our local `events` table
// ---------------------------------------------------------------------------

interface LocalEventInsert {
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  category: "pro";
  event_type: "fixed";
  external_id: string;
  external_source: "microsoft";
  recurrence: "none";
  is_urgent: boolean;
  reminder_minutes: number[];
}

export function mapOutlookEventToLocal(
  outlookEvent: OutlookEvent
): LocalEventInsert {
  // Outlook returns dateTime without a trailing Z when timezone is explicit.
  // Ensure we store them as proper ISO strings in UTC.
  const startRaw = outlookEvent.start.dateTime;
  const endRaw = outlookEvent.end.dateTime;

  const startAt = startRaw.endsWith("Z") ? startRaw : `${startRaw}Z`;
  const endAt = endRaw.endsWith("Z") ? endRaw : `${endRaw}Z`;

  return {
    title: outlookEvent.subject || "(Sans titre)",
    description: outlookEvent.bodyPreview || null,
    location: outlookEvent.location?.displayName || null,
    start_at: startAt,
    end_at: endAt,
    all_day: outlookEvent.isAllDay ?? false,
    category: "pro",
    event_type: "fixed",
    external_id: outlookEvent.id,
    external_source: "microsoft",
    recurrence: "none",
    is_urgent: false,
    reminder_minutes: [],
  };
}
