// === ENUMS ===

export type EventCategory = "pro" | "perso";
export type EventType = "fixed" | "flexible" | "task_block";
export type EventRecurrence = "none" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | "custom";

export type TaskStatus = "todo" | "scheduled" | "in_progress" | "done" | "cancelled";
export type TaskPriority = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = "high" | "medium" | "low";

export type ProjectStatus = "planning" | "active" | "paused" | "completed" | "archived";
export type ActivityFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "custom";

export type ConstraintType =
  | "min_gap"
  | "max_per_day"
  | "max_per_week"
  | "preferred_time"
  | "blocked_time"
  | "energy_curve";

// === MODELS ===

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  banner_url: string | null;
  theme: "light" | "dark" | "system";
  timezone: string;
  telegram_chat_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  color: string | null;
  category: EventCategory;
  event_type: EventType;
  start_at: string;
  end_at: string;
  all_day: boolean;
  recurrence: EventRecurrence;
  recurrence_rule: Record<string, unknown> | null;
  recurrence_end_at: string | null;
  parent_event_id: string | null;
  is_urgent: boolean;
  reminder_minutes: number[];
  activity_id: string | null;
  external_id: string | null;
  external_source: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  raw_input: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  priority: TaskPriority;
  energy_level: EnergyLevel | null;
  due_date: string | null;
  due_date_hard: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
  completed_at: string | null;
  status: TaskStatus;
  is_flexible: boolean;
  category: EventCategory;
  tags: string[];
  project_id: string | null;
  sequence_order: number | null;
  depends_on: string[];
  ai_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  category: EventCategory;
  target_date: string | null;
  status: ProjectStatus;
  default_interval_days: number;
  auto_schedule: boolean;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  category: EventCategory;
  frequency: ActivityFrequency;
  target_sessions_per_period: number;
  target_duration_minutes: number | null;
  current_streak: number;
  longest_streak: number;
  total_sessions: number;
  active: boolean;
  started_at: string;
  created_at: string;
  updated_at: string;
}

export interface ActivitySession {
  id: string;
  user_id: string;
  activity_id: string;
  event_id: string | null;
  session_date: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  rating: number | null;
  mood: string | null;
  metrics: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Constraint {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  constraint_type: ConstraintType;
  target_category: string | null;
  target_tags: string[];
  parameters: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  telegram_enabled: boolean;
  email_enabled: boolean;
  morning_digest_time: string;
  morning_digest_days: number[];
  urgent_alert_telegram: boolean;
  urgent_alert_email: boolean;
  urgent_alert_minutes_before: number;
  include_pro_tasks: boolean;
  include_perso_tasks: boolean;
  include_events: boolean;
  include_activities: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanningSession {
  id: string;
  user_id: string;
  session_type: "daily_plan" | "reorganize" | "project_schedule";
  target_date: string | null;
  snapshot_before: Record<string, unknown>;
  snapshot_after: Record<string, unknown>;
  ai_reasoning: string | null;
  status: "proposed" | "accepted" | "rejected" | "partially_accepted";
  created_at: string;
}

// === VIEW TYPES ===

export type CalendarView = "day" | "week" | "month";
export type DashboardTab = "pro" | "perso" | "global";

export interface TimeSlot {
  start: Date;
  end: Date;
  duration_minutes: number;
}

export interface ScheduledTask {
  task: Task;
  scheduled_start: Date;
  scheduled_end: Date;
  reasoning?: string;
}

export interface ReorganizationProposal {
  changes: Array<{
    item: CalendarEvent | Task;
    old_start: string;
    old_end: string;
    new_start: string;
    new_end: string;
    reason: string;
  }>;
  warnings: string[];
  can_fully_resolve: boolean;
}
