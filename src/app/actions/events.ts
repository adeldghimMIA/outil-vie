"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_USER_ID } from "@/lib/default-user";
import type { CalendarEvent, EventCategory } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getClient() {
  return await createClient();
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getEvents(
  userId: string,
  category?: EventCategory,
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> {
  const supabase = await getClient();

  let query = supabase
    .from("events")
    .select("*")
    .eq("user_id", DEFAULT_USER_ID)
    .order("start_at", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  if (startDate) {
    query = query.gte("start_at", startDate);
  }

  if (endDate) {
    query = query.lte("end_at", endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur lors de la récupération des événements: ${error.message}`);
  }

  return (data ?? []) as CalendarEvent[];
}

export async function getEventsByDate(
  userId: string,
  date: string
): Promise<CalendarEvent[]> {
  const supabase = await getClient();

  // Events that overlap with the given day (start < end-of-day AND end > start-of-day)
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", DEFAULT_USER_ID)
    .lte("start_at", dayEnd)
    .gte("end_at", dayStart)
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(`Erreur lors de la récupération des événements: ${error.message}`);
  }

  return (data ?? []) as CalendarEvent[];
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createEvent(
  formData: Omit<CalendarEvent, "id" | "user_id" | "created_at" | "updated_at">
): Promise<CalendarEvent> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: DEFAULT_USER_ID,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      color: formData.color,
      category: formData.category,
      event_type: formData.event_type,
      start_at: formData.start_at,
      end_at: formData.end_at,
      all_day: formData.all_day,
      recurrence: formData.recurrence,
      recurrence_rule: formData.recurrence_rule,
      recurrence_end_at: formData.recurrence_end_at,
      parent_event_id: formData.parent_event_id,
      is_urgent: formData.is_urgent,
      reminder_minutes: formData.reminder_minutes,
      activity_id: formData.activity_id,
      external_id: formData.external_id,
      external_source: formData.external_source,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création de l'événement: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");

  return data as CalendarEvent;
}

export async function updateEvent(
  id: string,
  formData: Partial<Omit<CalendarEvent, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<CalendarEvent> {
  const supabase = await getClient();

  const { data, error } = await supabase
    .from("events")
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la mise à jour de l'événement: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");

  return data as CalendarEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = await getClient();

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    throw new Error(`Erreur lors de la suppression de l'événement: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
