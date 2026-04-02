"use client";

import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  createTask,
  createTasksBatch,
  updateTask,
  completeTask,
  deleteTask,
} from "@/app/actions/tasks";
import type {
  Task,
  TaskStatus,
  EventCategory,
} from "@/types";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "@/app/actions/tasks";

// ─── Query Keys ──────────────────────────────────────────────────────────────

const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...taskKeys.lists(), filters] as const,
  today: (category?: EventCategory) =>
    [...taskKeys.all, "today", category ?? "all"] as const,
};

// ─── Read Hooks (Supabase browser client) ────────────────────────────────────

export function useTasks(category?: EventCategory, status?: TaskStatus) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery<Task[]>({
    queryKey: taskKeys.list({ category, status }),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Non authentifié");

      let query = supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "cancelled")
        .order("priority", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false });

      if (category) {
        query = query.eq("category", category);
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as Task[]) ?? [];
    },
  });
}

export function useTodayTasks(category?: EventCategory) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery<Task[]>({
    queryKey: taskKeys.today(category),
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Non authentifié");

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      let query = supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["todo", "scheduled", "in_progress"])
        .lte("due_date", todayEnd.toISOString())
        .order("priority", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as Task[]) ?? [];
    },
  });
}

// ─── Mutation Hooks (Server Actions) ─────────────────────────────────────────

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskInput) => createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useCreateTasksBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tasks: CreateTaskInput[]) => createTasksBatch(tasks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
