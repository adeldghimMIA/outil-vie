-- ============================================
-- GAMIFICATION SYSTEM
-- ============================================

-- === GAMIFICATION AXES ===

CREATE TABLE public.gamification_axes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- === USER LEVELS (per axis) ===

CREATE TABLE public.user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  axis_id UUID NOT NULL REFERENCES public.gamification_axes(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  xp_for_next_level INTEGER NOT NULL DEFAULT 100,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, axis_id)
);

-- === XP EVENTS (immutable log) ===

CREATE TABLE public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  axis_id UUID REFERENCES public.gamification_axes(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'task_completed', 'session_logged', 'streak_bonus',
    'objective_completed', 'badge_earned', 'challenge_completed', 'manual'
  )),
  source_id UUID,
  xp_amount INTEGER NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_xp_events_user_axis ON public.xp_events(user_id, axis_id, created_at);
CREATE INDEX idx_xp_events_user_date ON public.xp_events(user_id, created_at);

-- === BADGES ===

CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  axis_id UUID REFERENCES public.gamification_axes(id) ON DELETE SET NULL,
  criteria_type TEXT NOT NULL CHECK (criteria_type IN (
    'sessions_count', 'streak_days', 'xp_total',
    'level_reached', 'objective_completed', 'custom'
  )),
  criteria_value INTEGER NOT NULL,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- === USER BADGES (earned) ===

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- === OBJECTIVES ===

CREATE TABLE public.gamification_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  axis_id UUID NOT NULL REFERENCES public.gamification_axes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value REAL,
  current_value REAL DEFAULT 0,
  unit TEXT,
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- === DAILY CHALLENGES ===

CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  axis_id UUID REFERENCES public.gamification_axes(id) ON DELETE SET NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly')),
  target_value INTEGER NOT NULL DEFAULT 1,
  current_value INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  active_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_daily_challenges_user ON public.daily_challenges(user_id, active_date);

-- === MODIFY EXISTING TABLES ===

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS axis_id UUID REFERENCES public.gamification_axes(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS xp_value INTEGER DEFAULT 10;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS axis_id UUID REFERENCES public.gamification_axes(id) ON DELETE SET NULL;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS xp_per_session INTEGER DEFAULT 25;

-- === DISABLE RLS (mono-user) ===

ALTER TABLE public.gamification_axes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_objectives DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges DISABLE ROW LEVEL SECURITY;

-- === TRIGGERS ===

CREATE TRIGGER gamification_axes_updated_at BEFORE UPDATE ON public.gamification_axes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER user_levels_updated_at BEFORE UPDATE ON public.user_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER gamification_objectives_updated_at BEFORE UPDATE ON public.gamification_objectives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- === XP → LEVEL AUTO-CALCULATION TRIGGER ===

CREATE OR REPLACE FUNCTION public.update_user_level_on_xp()
RETURNS TRIGGER AS $$
DECLARE
  new_total INTEGER;
  new_level INTEGER;
  next_threshold INTEGER;
BEGIN
  IF NEW.axis_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(xp_amount), 0) INTO new_total
  FROM public.xp_events
  WHERE user_id = NEW.user_id AND axis_id = NEW.axis_id;

  -- Level formula: level = floor(sqrt(total_xp / 25)) + 1
  new_level := GREATEST(1, floor(sqrt(new_total::real / 25.0))::integer + 1);
  next_threshold := (new_level * new_level) * 25;

  INSERT INTO public.user_levels (user_id, axis_id, total_xp, current_level, xp_for_next_level)
  VALUES (NEW.user_id, NEW.axis_id, new_total, new_level, next_threshold)
  ON CONFLICT (user_id, axis_id)
  DO UPDATE SET
    total_xp = new_total,
    current_level = new_level,
    xp_for_next_level = next_threshold,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER xp_event_inserted
  AFTER INSERT ON public.xp_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_level_on_xp();

-- === SEED DATA: Default axes ===

INSERT INTO public.gamification_axes (user_id, name, slug, icon, color, display_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sport', 'sport', 'Dumbbell', '#ef4444', 1),
  ('00000000-0000-0000-0000-000000000001', 'Intelligence', 'intelligence', 'Brain', '#3b82f6', 2),
  ('00000000-0000-0000-0000-000000000001', 'Langues', 'langues', 'Languages', '#22c55e', 3),
  ('00000000-0000-0000-0000-000000000001', 'Carriere', 'career', 'Briefcase', '#f59e0b', 4),
  ('00000000-0000-0000-0000-000000000001', 'Creativite', 'creativity', 'Palette', '#8b5cf6', 5),
  ('00000000-0000-0000-0000-000000000001', 'Social', 'social', 'Users', '#ec4899', 6),
  ('00000000-0000-0000-0000-000000000001', 'Sante', 'health', 'Heart', '#10b981', 7);

-- Initialize user_levels for each axis
INSERT INTO public.user_levels (user_id, axis_id, total_xp, current_level, xp_for_next_level)
SELECT '00000000-0000-0000-0000-000000000001', id, 0, 1, 100
FROM public.gamification_axes
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- === SEED DATA: Default badges ===

-- Streak badges (global)
INSERT INTO public.badges (user_id, name, description, icon, criteria_type, criteria_value, rarity) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Premiere flamme', '7 jours de streak', '🔥', 'streak_days', 7, 'common'),
  ('00000000-0000-0000-0000-000000000001', 'En feu', '30 jours de streak', '🔥', 'streak_days', 30, 'rare'),
  ('00000000-0000-0000-0000-000000000001', 'Inarretable', '100 jours de streak', '🔥', 'streak_days', 100, 'legendary');

-- Level badges
INSERT INTO public.badges (user_id, name, description, icon, criteria_type, criteria_value, rarity) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Apprenti', 'Atteindre niveau 5', '⭐', 'level_reached', 5, 'common'),
  ('00000000-0000-0000-0000-000000000001', 'Competent', 'Atteindre niveau 10', '⭐', 'level_reached', 10, 'rare'),
  ('00000000-0000-0000-0000-000000000001', 'Expert', 'Atteindre niveau 25', '⭐', 'level_reached', 25, 'epic'),
  ('00000000-0000-0000-0000-000000000001', 'Maitre', 'Atteindre niveau 50', '⭐', 'level_reached', 50, 'legendary');

-- Session count badges
INSERT INTO public.badges (user_id, name, description, icon, criteria_type, criteria_value, rarity) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Premier pas', '10 sessions completees', '👟', 'sessions_count', 10, 'common'),
  ('00000000-0000-0000-0000-000000000001', 'Regulier', '50 sessions completees', '💪', 'sessions_count', 50, 'rare'),
  ('00000000-0000-0000-0000-000000000001', 'Machine', '100 sessions completees', '🏆', 'sessions_count', 100, 'epic'),
  ('00000000-0000-0000-0000-000000000001', 'Legende', '500 sessions completees', '👑', 'sessions_count', 500, 'legendary');

-- XP badges
INSERT INTO public.badges (user_id, name, description, icon, criteria_type, criteria_value, rarity) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Collecteur', '1000 XP accumules', '💎', 'xp_total', 1000, 'common'),
  ('00000000-0000-0000-0000-000000000001', 'Tresorier', '5000 XP accumules', '💎', 'xp_total', 5000, 'rare'),
  ('00000000-0000-0000-0000-000000000001', 'Mogul', '25000 XP accumules', '💎', 'xp_total', 25000, 'epic'),
  ('00000000-0000-0000-0000-000000000001', 'Titan', '100000 XP accumules', '💎', 'xp_total', 100000, 'legendary');
