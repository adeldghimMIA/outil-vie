"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/app/actions/events";
import type { CalendarEvent, EventCategory } from "@/types";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, "detail"] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// useEvents – fetch events with optional category & date range filters
// ---------------------------------------------------------------------------

interface UseEventsOptions {
  category?: EventCategory;
  dateRange?: { start: string; end: string };
}

export function useEvents(options: UseEventsOptions = {}) {
  const { category, dateRange } = options;

  return useQuery<CalendarEvent[]>({
    queryKey: eventKeys.list({ category, dateRange }),
    queryFn: async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Non authentifié");
      }

      let query = supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .order("start_at", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      if (dateRange?.start) {
        query = query.gte("start_at", dateRange.start);
      }

      if (dateRange?.end) {
        query = query.lte("end_at", dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as CalendarEvent[];
    },
  });
}

// ---------------------------------------------------------------------------
// useCreateEvent
// ---------------------------------------------------------------------------

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      formData: Omit<CalendarEvent, "id" | "user_id" | "created_at" | "updated_at">
    ) => createEvent(formData),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateEvent
// ---------------------------------------------------------------------------

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<CalendarEvent, "id" | "user_id" | "created_at" | "updated_at">>;
    }) => updateEvent(id, data),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.invalidateQueries({
        queryKey: eventKeys.detail(variables.id),
      });
    },
  });
}

// ---------------------------------------------------------------------------
// useDeleteEvent
// ---------------------------------------------------------------------------

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}
