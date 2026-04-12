-- ============================================
-- PROJET AYANOKOJI: PILIERS & SKILL MILESTONES
-- ============================================

-- === A. CREATE SKILL_MILESTONES TABLE ===

CREATE TABLE public.skill_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  axis_id UUID NOT NULL REFERENCES public.gamification_axes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  target_date TIMESTAMPTZ,
  duration_weeks INTEGER,
  xp_reward INTEGER DEFAULT 100,
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'completed')),
  completed_at TIMESTAMPTZ,
  parent_id UUID REFERENCES public.skill_milestones(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.skill_milestones DISABLE ROW LEVEL SECURITY;

CREATE TRIGGER skill_milestones_updated_at BEFORE UPDATE ON public.skill_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_skill_milestones_axis ON public.skill_milestones(axis_id, order_index);

-- === B. REPLACE 7 AXES WITH 6 AYANOKOJI PILIERS ===

-- Delete old axes and their related data
DELETE FROM public.user_levels WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM public.gamification_axes WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Insert 6 new piliers
INSERT INTO public.gamification_axes (user_id, name, slug, description, icon, color, display_order) VALUES
('00000000-0000-0000-0000-000000000001', 'Discipline & Maitrise de soi', 'discipline', 'Sommeil, routines, zero decision le matin, capacite a demarrer une tache en 2 minutes', 'Shield', '#64748b', 1),
('00000000-0000-0000-0000-000000000001', 'Physique', 'physique', 'Escalade + MMA + cardio/renfo. Les trois ensemble font un physique complet', 'Dumbbell', '#ef4444', 2),
('00000000-0000-0000-0000-000000000001', 'Intellect', 'intellect', 'Maths/ML, culture G, lecture, Coursera. Pensee analytique et profondeur conversationnelle', 'Brain', '#3b82f6', 3),
('00000000-0000-0000-0000-000000000001', 'Communication & Presence', 'communication', 'Repartie, aisance sociale, charisme. Se travaille par la pratique quotidienne', 'MessageCircle', '#f59e0b', 4),
('00000000-0000-0000-0000-000000000001', 'Competences concretes', 'competences', 'Espagnol, guitare, finances, tech/IA. Des skills tangibles qui elargissent ton spectre', 'Wrench', '#22c55e', 5),
('00000000-0000-0000-0000-000000000001', 'Recuperation & Nutrition', 'recuperation', 'Sommeil, alimentation, gestion du stress. Le carburant de la machine', 'Heart', '#10b981', 6);

-- Initialize user_levels with confirmed levels
-- Level formula: xp = (level-1)^2 * 25
INSERT INTO public.user_levels (user_id, axis_id, total_xp, current_level, xp_for_next_level)
SELECT '00000000-0000-0000-0000-000000000001', id,
  CASE slug
    WHEN 'discipline' THEN 25    -- level 2
    WHEN 'physique' THEN 400     -- level 5
    WHEN 'intellect' THEN 225    -- level 4
    WHEN 'communication' THEN 225 -- level 4
    WHEN 'competences' THEN 225   -- level 4
    WHEN 'recuperation' THEN 225  -- level 4
  END,
  CASE slug
    WHEN 'discipline' THEN 2
    WHEN 'physique' THEN 5
    WHEN 'intellect' THEN 4
    WHEN 'communication' THEN 4
    WHEN 'competences' THEN 4
    WHEN 'recuperation' THEN 4
  END,
  CASE slug
    WHEN 'discipline' THEN 100
    WHEN 'physique' THEN 625
    WHEN 'intellect' THEN 400
    WHEN 'communication' THEN 400
    WHEN 'competences' THEN 400
    WHEN 'recuperation' THEN 400
  END
FROM public.gamification_axes WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- === C. SEED SKILL_MILESTONES FOR EACH PILIER ===

-- Espagnol (under 'competences')
INSERT INTO public.skill_milestones (user_id, axis_id, title, order_index, duration_weeks, xp_reward, status) VALUES
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'competences' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Maitriser present et passe compose', 1, 2, 100, 'active'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'competences' AND user_id = '00000000-0000-0000-0000-000000000001'), '150h input comprehensible (Dreaming Spanish)', 2, 12, 200, 'locked'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'competences' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Premiere conversation 30min en espagnol', 3, 4, 150, 'locked'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'competences' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Atteindre niveau B1', 4, 24, 300, 'locked'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'competences' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Conversations hebdomadaires italki', 5, NULL, 150, 'locked'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'competences' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Atteindre niveau B2', 6, 48, 500, 'locked');

-- Escalade (under 'physique')
INSERT INTO public.skill_milestones (user_id, axis_id, title, order_index, duration_weeks, xp_reward, status) VALUES
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'physique' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Reussir un 6a en salle', 1, 4, 100, 'active'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'physique' AND user_id = '00000000-0000-0000-0000-000000000001'), '3 seances/semaine pendant 1 mois', 2, 4, 150, 'locked'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'physique' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Reussir un 6b en salle', 3, 8, 200, 'locked'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'physique' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Reussir un 6c', 4, 16, 300, 'locked');

-- MMA (under 'physique')
INSERT INTO public.skill_milestones (user_id, axis_id, title, order_index, duration_weeks, xp_reward, status) VALUES
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'physique' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Premier cours d''essai MMA', 1, 1, 50, 'active'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'physique' AND user_id = '00000000-0000-0000-0000-000000000001'), '1 mois de MMA regulier (4 seances)', 2, 4, 150, 'locked'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'physique' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Premier sparring', 3, 8, 200, 'locked');

-- Coursera Maths (under 'intellect')
INSERT INTO public.skill_milestones (user_id, axis_id, title, order_index, duration_weeks, xp_reward, status) VALUES
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'intellect' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Terminer Linear Algebra', 1, 6, 200, 'active'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'intellect' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Terminer Multivariate Calculus', 2, 6, 200, 'locked'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'intellect' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Terminer PCA', 3, 5, 200, 'locked'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'intellect' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Obtenir la certification', 4, 1, 300, 'locked');

-- Culture G (under 'intellect')
INSERT INTO public.skill_milestones (user_id, axis_id, title, order_index, duration_weeks, xp_reward, status) VALUES
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'intellect' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Voir Apocalypse WWII (6 episodes)', 1, 4, 100, 'active'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'intellect' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Lire Sapiens', 2, 8, 150, 'locked'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'intellect' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Guerre froide + Revolution francaise', 3, 4, 100, 'locked');

-- Guitare (under 'competences')
INSERT INTO public.skill_milestones (user_id, axis_id, title, order_index, duration_weeks, xp_reward, status) VALUES
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'competences' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Maitriser 5 accords ouverts (Em, Am, C, G, D)', 1, 4, 100, 'active'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'competences' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Jouer Wish You Were Here', 2, 8, 150, 'locked'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'competences' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Accords barres (F, Bm)', 3, 8, 200, 'locked');

-- Discipline
INSERT INTO public.skill_milestones (user_id, axis_id, title, order_index, duration_weeks, xp_reward, status) VALUES
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'discipline' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Couche 23h30 pendant 7 jours consecutifs', 1, 1, 100, 'active'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'discipline' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Routine matin sans telephone pendant 14 jours', 2, 2, 150, 'locked'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'discipline' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Journal 3 lignes chaque soir pendant 30 jours', 3, 4, 200, 'locked');

-- Recuperation
INSERT INTO public.skill_milestones (user_id, axis_id, title, order_index, duration_weeks, xp_reward, status) VALUES
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'recuperation' AND user_id = '00000000-0000-0000-0000-000000000001'), '7h45 de sommeil pendant 7 jours', 1, 1, 100, 'active'),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM public.gamification_axes WHERE slug = 'recuperation' AND user_id = '00000000-0000-0000-0000-000000000001'), 'Cuisiner un repas sain par semaine pendant 1 mois', 2, 4, 100, 'locked');
