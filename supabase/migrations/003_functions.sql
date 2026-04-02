-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER activities_updated_at BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER activity_sessions_updated_at BEFORE UPDATE ON public.activity_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER connected_accounts_updated_at BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER quick_notes_updated_at BEFORE UPDATE ON public.quick_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  -- Also create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to find free time slots in a day
CREATE OR REPLACE FUNCTION public.get_free_slots(
  p_user_id UUID,
  p_date DATE,
  p_day_start TIME DEFAULT '08:00',
  p_day_end TIME DEFAULT '22:00',
  p_min_duration_minutes INTEGER DEFAULT 15
)
RETURNS TABLE(slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ, duration_minutes INTEGER) AS $$
DECLARE
  day_start TIMESTAMPTZ := (p_date || ' ' || p_day_start)::TIMESTAMPTZ;
  day_end TIMESTAMPTZ := (p_date || ' ' || p_day_end)::TIMESTAMPTZ;
  prev_end TIMESTAMPTZ := day_start;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT e.start_at, e.end_at
    FROM public.events e
    WHERE e.user_id = p_user_id
      AND e.start_at < day_end
      AND e.end_at > day_start
    ORDER BY e.start_at
  LOOP
    IF rec.start_at > prev_end AND
       EXTRACT(EPOCH FROM (rec.start_at - prev_end)) / 60 >= p_min_duration_minutes THEN
      slot_start := prev_end;
      slot_end := rec.start_at;
      duration_minutes := (EXTRACT(EPOCH FROM (slot_end - slot_start)) / 60)::INTEGER;
      RETURN NEXT;
    END IF;
    IF rec.end_at > prev_end THEN
      prev_end := rec.end_at;
    END IF;
  END LOOP;

  -- Last slot of the day
  IF day_end > prev_end AND
     EXTRACT(EPOCH FROM (day_end - prev_end)) / 60 >= p_min_duration_minutes THEN
    slot_start := prev_end;
    slot_end := day_end;
    duration_minutes := (EXTRACT(EPOCH FROM (slot_end - slot_start)) / 60)::INTEGER;
    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
