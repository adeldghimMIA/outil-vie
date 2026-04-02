-- ============================================
-- OUTIL DE VIE - Schema initial
-- ============================================

-- === ENUMS ===

CREATE TYPE event_category AS ENUM ('pro', 'perso');
CREATE TYPE event_type AS ENUM ('fixed', 'flexible', 'task_block');
CREATE TYPE event_recurrence AS ENUM ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly', 'custom');
CREATE TYPE task_status AS ENUM ('todo', 'scheduled', 'in_progress', 'done', 'cancelled');
CREATE TYPE task_priority AS ENUM ('1', '2', '3', '4', '5');
CREATE TYPE energy_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'paused', 'completed', 'archived');
CREATE TYPE activity_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'custom');
CREATE TYPE constraint_type AS ENUM ('min_gap', 'max_per_day', 'max_per_week', 'preferred_time', 'blocked_time', 'energy_curve');
CREATE TYPE planning_session_type AS ENUM ('daily_plan', 'reorganize', 'project_schedule');
CREATE TYPE planning_session_status AS ENUM ('proposed', 'accepted', 'rejected', 'partially_accepted');

-- === PROFILES ===

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  banner_url TEXT,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  timezone TEXT DEFAULT 'Europe/Paris',
  telegram_chat_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- === NOTIFICATION PREFERENCES ===

CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  telegram_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  morning_digest_time TIME DEFAULT '07:30',
  morning_digest_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}',
  urgent_alert_telegram BOOLEAN DEFAULT true,
  urgent_alert_email BOOLEAN DEFAULT false,
  urgent_alert_minutes_before INTEGER DEFAULT 30,
  include_pro_tasks BOOLEAN DEFAULT true,
  include_perso_tasks BOOLEAN DEFAULT true,
  include_events BOOLEAN DEFAULT true,
  include_activities BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- === PROJECTS ===

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  category event_category NOT NULL DEFAULT 'pro',
  target_date TIMESTAMPTZ,
  status project_status NOT NULL DEFAULT 'active',
  default_interval_days INTEGER DEFAULT 0,
  auto_schedule BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- === ACTIVITIES ===

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#10b981',
  category event_category DEFAULT 'perso',
  frequency activity_frequency NOT NULL DEFAULT 'weekly',
  target_sessions_per_period INTEGER DEFAULT 1,
  target_duration_minutes INTEGER,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  started_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- === EVENTS ===

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  color TEXT,
  category event_category NOT NULL,
  event_type event_type NOT NULL DEFAULT 'fixed',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  recurrence event_recurrence DEFAULT 'none',
  recurrence_rule JSONB,
  recurrence_end_at TIMESTAMPTZ,
  parent_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  is_urgent BOOLEAN DEFAULT false,
  reminder_minutes INTEGER[] DEFAULT '{30}',
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  external_id TEXT,
  external_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_at > start_at)
);

-- === TASKS ===

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  raw_input TEXT,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  priority task_priority NOT NULL DEFAULT '3',
  energy_level energy_level,
  due_date TIMESTAMPTZ,
  due_date_hard BOOLEAN DEFAULT false,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status task_status NOT NULL DEFAULT 'todo',
  is_flexible BOOLEAN DEFAULT true,
  category event_category NOT NULL DEFAULT 'pro',
  tags TEXT[] DEFAULT '{}',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  sequence_order INTEGER,
  depends_on UUID[] DEFAULT '{}',
  ai_confidence REAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- === ACTIVITY SESSIONS ===

CREATE TABLE public.activity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  mood TEXT,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- === CONSTRAINTS ===

CREATE TABLE public.constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  constraint_type constraint_type NOT NULL,
  target_category TEXT,
  target_tags TEXT[] DEFAULT '{}',
  parameters JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- === PLANNING SESSIONS ===

CREATE TABLE public.planning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_type planning_session_type NOT NULL,
  target_date DATE,
  snapshot_before JSONB NOT NULL DEFAULT '{}',
  snapshot_after JSONB NOT NULL DEFAULT '{}',
  ai_reasoning TEXT,
  status planning_session_status DEFAULT 'proposed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- === CONNECTED ACCOUNTS (pour sync future Outlook/Google) ===

CREATE TABLE public.connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('microsoft', 'google')),
  provider_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  sync_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- === QUICK NOTES ===

CREATE TABLE public.quick_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category event_category,
  pinned BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- === NOTIFICATION LOG ===

CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'email')),
  type TEXT NOT NULL CHECK (type IN ('morning_digest', 'urgent_alert', 'newsletter')),
  content TEXT,
  metadata JSONB,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- === INDEXES ===

CREATE INDEX idx_events_user_date ON public.events(user_id, start_at, end_at);
CREATE INDEX idx_events_category ON public.events(user_id, category);
CREATE INDEX idx_events_parent ON public.events(parent_event_id) WHERE parent_event_id IS NOT NULL;
CREATE INDEX idx_events_activity ON public.events(activity_id) WHERE activity_id IS NOT NULL;

CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX idx_tasks_due ON public.tasks(user_id, due_date) WHERE status NOT IN ('done', 'cancelled');
CREATE INDEX idx_tasks_scheduled ON public.tasks(user_id, scheduled_start, scheduled_end) WHERE scheduled_start IS NOT NULL;
CREATE INDEX idx_tasks_project ON public.tasks(project_id, sequence_order) WHERE project_id IS NOT NULL;

CREATE INDEX idx_projects_user_status ON public.projects(user_id, status);
CREATE INDEX idx_activities_user ON public.activities(user_id) WHERE active = true;
CREATE INDEX idx_sessions_activity ON public.activity_sessions(activity_id, session_date);
CREATE INDEX idx_constraints_user ON public.constraints(user_id) WHERE is_active = true;
CREATE INDEX idx_quick_notes_user ON public.quick_notes(user_id) WHERE archived = false;
