"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_ID } from "@/lib/default-user";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getClient() {
  return await createClient();
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScheduleEvent {
  title: string;
  description: string | null;
  category: "pro" | "perso";
  event_type: "fixed" | "flexible";
  dayOffset: number; // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  color: string;
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const COLORS = {
  pro: "#6366f1",
  escalade: "#ef4444",
  espagnol: "#22c55e",
  coursera: "#3b82f6",
  guitare: "#22c55e",
  mma: "#ef4444",
  routine: "#64748b",
  lecture: "#3b82f6",
} as const;

// ─── Weekly Schedule Definition ──────────────────────────────────────────────

const WEEKLY_EVENTS: ScheduleEvent[] = [
  // ── MONDAY (dayOffset: 0) ──
  {
    title: "Routine matin",
    description: "Reveil, meditation, journaling, preparation",
    category: "perso",
    event_type: "fixed",
    dayOffset: 0,
    startHour: 7,
    startMinute: 0,
    endHour: 7,
    endMinute: 45,
    color: COLORS.routine,
  },
  {
    title: "Travail pro",
    description: "Bloc de travail professionnel",
    category: "pro",
    event_type: "fixed",
    dayOffset: 0,
    startHour: 9,
    startMinute: 0,
    endHour: 12,
    endMinute: 30,
    color: COLORS.pro,
  },
  {
    title: "Espagnol - Dreaming Spanish + Anki",
    description: "Input comprehensible + revision vocabulaire [Pilier: Competences]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 0,
    startHour: 13,
    startMinute: 30,
    endHour: 14,
    endMinute: 15,
    color: COLORS.espagnol,
  },
  {
    title: "Travail pro",
    description: "Bloc de travail professionnel (apres-midi)",
    category: "pro",
    event_type: "fixed",
    dayOffset: 0,
    startHour: 14,
    startMinute: 30,
    endHour: 18,
    endMinute: 0,
    color: COLORS.pro,
  },
  {
    title: "Escalade",
    description: "Seance escalade en salle [Pilier: Physique]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 0,
    startHour: 18,
    startMinute: 30,
    endHour: 20,
    endMinute: 30,
    color: COLORS.escalade,
  },
  {
    title: "Guitare",
    description: "Pratique guitare - accords et morceaux [Pilier: Competences]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 0,
    startHour: 21,
    startMinute: 0,
    endHour: 21,
    endMinute: 30,
    color: COLORS.guitare,
  },
  {
    title: "Routine soir",
    description: "Journal, lecture, preparation lendemain. Couche 23h30",
    category: "perso",
    event_type: "fixed",
    dayOffset: 0,
    startHour: 22,
    startMinute: 30,
    endHour: 23,
    endMinute: 30,
    color: COLORS.routine,
  },

  // ── TUESDAY (dayOffset: 1) ──
  {
    title: "Routine matin",
    description: "Reveil, meditation, journaling, preparation",
    category: "perso",
    event_type: "fixed",
    dayOffset: 1,
    startHour: 7,
    startMinute: 0,
    endHour: 7,
    endMinute: 45,
    color: COLORS.routine,
  },
  {
    title: "Travail pro",
    description: "Bloc de travail professionnel",
    category: "pro",
    event_type: "fixed",
    dayOffset: 1,
    startHour: 9,
    startMinute: 0,
    endHour: 12,
    endMinute: 30,
    color: COLORS.pro,
  },
  {
    title: "Coursera - Maths for ML",
    description: "Linear Algebra / Multivariate Calculus / PCA [Pilier: Intellect]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 1,
    startHour: 13,
    startMinute: 30,
    endHour: 14,
    endMinute: 30,
    color: COLORS.coursera,
  },
  {
    title: "Travail pro",
    description: "Bloc de travail professionnel (apres-midi)",
    category: "pro",
    event_type: "fixed",
    dayOffset: 1,
    startHour: 14,
    startMinute: 30,
    endHour: 18,
    endMinute: 0,
    color: COLORS.pro,
  },
  {
    title: "MMA",
    description: "Cours MMA / boxe [Pilier: Physique]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 1,
    startHour: 18,
    startMinute: 30,
    endHour: 20,
    endMinute: 0,
    color: COLORS.mma,
  },
  {
    title: "Espagnol - Dreaming Spanish",
    description: "Input comprehensible [Pilier: Competences]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 1,
    startHour: 20,
    startMinute: 30,
    endHour: 21,
    endMinute: 0,
    color: COLORS.espagnol,
  },
  {
    title: "Routine soir",
    description: "Journal, lecture, preparation lendemain. Couche 23h30",
    category: "perso",
    event_type: "fixed",
    dayOffset: 1,
    startHour: 22,
    startMinute: 30,
    endHour: 23,
    endMinute: 30,
    color: COLORS.routine,
  },

  // ── WEDNESDAY (dayOffset: 2) ──
  {
    title: "Routine matin",
    description: "Reveil, meditation, journaling, preparation",
    category: "perso",
    event_type: "fixed",
    dayOffset: 2,
    startHour: 7,
    startMinute: 0,
    endHour: 7,
    endMinute: 45,
    color: COLORS.routine,
  },
  {
    title: "Travail pro",
    description: "Bloc de travail professionnel",
    category: "pro",
    event_type: "fixed",
    dayOffset: 2,
    startHour: 9,
    startMinute: 0,
    endHour: 12,
    endMinute: 30,
    color: COLORS.pro,
  },
  {
    title: "Espagnol - Dreaming Spanish + Anki",
    description: "Input comprehensible + revision vocabulaire [Pilier: Competences]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 2,
    startHour: 13,
    startMinute: 30,
    endHour: 14,
    endMinute: 15,
    color: COLORS.espagnol,
  },
  {
    title: "Travail pro",
    description: "Bloc de travail professionnel (apres-midi)",
    category: "pro",
    event_type: "fixed",
    dayOffset: 2,
    startHour: 14,
    startMinute: 30,
    endHour: 18,
    endMinute: 0,
    color: COLORS.pro,
  },
  {
    title: "Escalade",
    description: "Seance escalade en salle [Pilier: Physique]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 2,
    startHour: 18,
    startMinute: 30,
    endHour: 20,
    endMinute: 30,
    color: COLORS.escalade,
  },
  {
    title: "Lecture / Culture G",
    description: "Lecture ou documentaire (Sapiens, Apocalypse WWII, etc.) [Pilier: Intellect]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 2,
    startHour: 21,
    startMinute: 0,
    endHour: 22,
    endMinute: 0,
    color: COLORS.lecture,
  },
  {
    title: "Routine soir",
    description: "Journal, lecture, preparation lendemain. Couche 23h30",
    category: "perso",
    event_type: "fixed",
    dayOffset: 2,
    startHour: 22,
    startMinute: 30,
    endHour: 23,
    endMinute: 30,
    color: COLORS.routine,
  },

  // ── THURSDAY (dayOffset: 3) ──
  {
    title: "Routine matin",
    description: "Reveil, meditation, journaling, preparation",
    category: "perso",
    event_type: "fixed",
    dayOffset: 3,
    startHour: 7,
    startMinute: 0,
    endHour: 7,
    endMinute: 45,
    color: COLORS.routine,
  },
  {
    title: "Travail pro",
    description: "Bloc de travail professionnel",
    category: "pro",
    event_type: "fixed",
    dayOffset: 3,
    startHour: 9,
    startMinute: 0,
    endHour: 12,
    endMinute: 30,
    color: COLORS.pro,
  },
  {
    title: "Coursera - Maths for ML",
    description: "Linear Algebra / Multivariate Calculus / PCA [Pilier: Intellect]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 3,
    startHour: 13,
    startMinute: 30,
    endHour: 14,
    endMinute: 30,
    color: COLORS.coursera,
  },
  {
    title: "Travail pro",
    description: "Bloc de travail professionnel (apres-midi)",
    category: "pro",
    event_type: "fixed",
    dayOffset: 3,
    startHour: 14,
    startMinute: 30,
    endHour: 18,
    endMinute: 0,
    color: COLORS.pro,
  },
  {
    title: "MMA",
    description: "Cours MMA / boxe [Pilier: Physique]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 3,
    startHour: 18,
    startMinute: 30,
    endHour: 20,
    endMinute: 0,
    color: COLORS.mma,
  },
  {
    title: "Guitare",
    description: "Pratique guitare - accords et morceaux [Pilier: Competences]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 3,
    startHour: 20,
    startMinute: 30,
    endHour: 21,
    endMinute: 0,
    color: COLORS.guitare,
  },
  {
    title: "Routine soir",
    description: "Journal, lecture, preparation lendemain. Couche 23h30",
    category: "perso",
    event_type: "fixed",
    dayOffset: 3,
    startHour: 22,
    startMinute: 30,
    endHour: 23,
    endMinute: 30,
    color: COLORS.routine,
  },

  // ── FRIDAY (dayOffset: 4) ──
  {
    title: "Routine matin",
    description: "Reveil, meditation, journaling, preparation",
    category: "perso",
    event_type: "fixed",
    dayOffset: 4,
    startHour: 7,
    startMinute: 0,
    endHour: 7,
    endMinute: 45,
    color: COLORS.routine,
  },
  {
    title: "Travail pro",
    description: "Bloc de travail professionnel",
    category: "pro",
    event_type: "fixed",
    dayOffset: 4,
    startHour: 9,
    startMinute: 0,
    endHour: 12,
    endMinute: 30,
    color: COLORS.pro,
  },
  {
    title: "Espagnol - Dreaming Spanish + Anki",
    description: "Input comprehensible + revision vocabulaire [Pilier: Competences]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 4,
    startHour: 13,
    startMinute: 30,
    endHour: 14,
    endMinute: 15,
    color: COLORS.espagnol,
  },
  {
    title: "Travail pro",
    description: "Bloc de travail professionnel (apres-midi)",
    category: "pro",
    event_type: "fixed",
    dayOffset: 4,
    startHour: 14,
    startMinute: 30,
    endHour: 17,
    endMinute: 0,
    color: COLORS.pro,
  },
  {
    title: "Escalade",
    description: "Seance escalade en salle [Pilier: Physique]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 4,
    startHour: 17,
    startMinute: 30,
    endHour: 19,
    endMinute: 30,
    color: COLORS.escalade,
  },
  {
    title: "Routine soir",
    description: "Journal, lecture, preparation lendemain. Couche 23h30",
    category: "perso",
    event_type: "fixed",
    dayOffset: 4,
    startHour: 22,
    startMinute: 30,
    endHour: 23,
    endMinute: 30,
    color: COLORS.routine,
  },

  // ── SATURDAY (dayOffset: 5) ──
  {
    title: "Routine matin (weekend)",
    description: "Reveil plus tard, meditation, preparation",
    category: "perso",
    event_type: "fixed",
    dayOffset: 5,
    startHour: 8,
    startMinute: 0,
    endHour: 8,
    endMinute: 45,
    color: COLORS.routine,
  },
  {
    title: "Coursera - Maths for ML",
    description: "Session longue weekend [Pilier: Intellect]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 5,
    startHour: 9,
    startMinute: 0,
    endHour: 11,
    endMinute: 0,
    color: COLORS.coursera,
  },
  {
    title: "Espagnol - Pratique conversation",
    description: "Italki ou pratique orale [Pilier: Competences]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 5,
    startHour: 11,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    color: COLORS.espagnol,
  },
  {
    title: "Lecture / Culture G",
    description: "Lecture ou documentaire (Sapiens, Apocalypse WWII, etc.) [Pilier: Intellect]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 5,
    startHour: 14,
    startMinute: 0,
    endHour: 15,
    endMinute: 30,
    color: COLORS.lecture,
  },
  {
    title: "Guitare",
    description: "Session longue weekend [Pilier: Competences]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 5,
    startHour: 16,
    startMinute: 0,
    endHour: 17,
    endMinute: 0,
    color: COLORS.guitare,
  },
  {
    title: "Routine soir",
    description: "Journal, lecture, preparation lendemain. Couche 23h30",
    category: "perso",
    event_type: "fixed",
    dayOffset: 5,
    startHour: 22,
    startMinute: 30,
    endHour: 23,
    endMinute: 30,
    color: COLORS.routine,
  },

  // ── SUNDAY (dayOffset: 6) ──
  {
    title: "Routine matin (weekend)",
    description: "Reveil plus tard, meditation, preparation",
    category: "perso",
    event_type: "fixed",
    dayOffset: 6,
    startHour: 8,
    startMinute: 30,
    endHour: 9,
    endMinute: 15,
    color: COLORS.routine,
  },
  {
    title: "Espagnol - Dreaming Spanish",
    description: "Session longue input comprehensible [Pilier: Competences]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 6,
    startHour: 10,
    startMinute: 0,
    endHour: 11,
    endMinute: 0,
    color: COLORS.espagnol,
  },
  {
    title: "Lecture / Culture G",
    description: "Lecture ou documentaire [Pilier: Intellect]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 6,
    startHour: 11,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    color: COLORS.lecture,
  },
  {
    title: "Revue hebdomadaire & planification",
    description: "Bilan de la semaine, ajustements, planification semaine suivante [Pilier: Discipline]",
    category: "perso",
    event_type: "fixed",
    dayOffset: 6,
    startHour: 15,
    startMinute: 0,
    endHour: 16,
    endMinute: 0,
    color: COLORS.routine,
  },
  {
    title: "Routine soir",
    description: "Journal, lecture, preparation lendemain. Couche 23h30",
    category: "perso",
    event_type: "fixed",
    dayOffset: 6,
    startHour: 22,
    startMinute: 30,
    endHour: 23,
    endMinute: 30,
    color: COLORS.routine,
  },
];

// ─── Helper: Build ISO timestamp ─────────────────────────────────────────────

function buildTimestamp(
  baseDate: Date,
  dayOffset: number,
  hour: number,
  minute: number
): string {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

// ─── Main Import Function ────────────────────────────────────────────────────

/**
 * Import the Ayanokoji weekly schedule as recurring events.
 * Base date: Monday April 14, 2026.
 * Deletes existing recurring events to avoid duplicates on re-import.
 */
export async function importAyanokojiSchedule(): Promise<{
  created: number;
  deleted: number;
}> {
  const supabase = await getClient();

  // Monday April 14, 2026 at midnight (local Paris time approximation)
  const baseDate = new Date("2026-04-14T00:00:00+02:00");

  // 1. Delete existing recurring events for DEFAULT_USER_ID (to avoid duplicates)
  const { data: existingRecurring, error: fetchError } = await supabase
    .from("events")
    .select("id")
    .eq("user_id", DEFAULT_USER_ID)
    .eq("recurrence", "weekly");

  if (fetchError) {
    throw new Error(
      `Erreur lors de la recuperation des evenements recurrents : ${fetchError.message}`
    );
  }

  let deletedCount = 0;
  if (existingRecurring && existingRecurring.length > 0) {
    const ids = existingRecurring.map((e: { id: string }) => e.id);
    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .in("id", ids);

    if (deleteError) {
      throw new Error(
        `Erreur lors de la suppression des evenements recurrents : ${deleteError.message}`
      );
    }
    deletedCount = ids.length;
  }

  // 2. Build all event rows
  const rows = WEEKLY_EVENTS.map((event) => ({
    user_id: DEFAULT_USER_ID,
    title: event.title,
    description: event.description,
    location: null,
    color: event.color,
    category: event.category,
    event_type: event.event_type,
    start_at: buildTimestamp(
      baseDate,
      event.dayOffset,
      event.startHour,
      event.startMinute
    ),
    end_at: buildTimestamp(
      baseDate,
      event.dayOffset,
      event.endHour,
      event.endMinute
    ),
    all_day: false,
    recurrence: "weekly" as const,
    recurrence_rule: null,
    recurrence_end_at: null,
    parent_event_id: null,
    is_urgent: false,
    reminder_minutes: [] as number[],
    activity_id: null,
    external_id: null,
    external_source: null,
  }));

  // 3. Insert all events in a single batch
  const { data: created, error: insertError } = await supabase
    .from("events")
    .insert(rows)
    .select();

  if (insertError) {
    throw new Error(
      `Erreur lors de la creation des evenements : ${insertError.message}`
    );
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");

  return {
    created: created?.length ?? 0,
    deleted: deletedCount,
  };
}
