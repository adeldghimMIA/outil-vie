-- Insert default user for mono-user app (no auth)
INSERT INTO auth.users (id, instance_id, role, aud, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data, is_super_admin)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'adel@outil-vie.local',
  '',
  now(),
  now(),
  now(),
  '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Adel"}',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Insert default profile
INSERT INTO public.profiles (id, full_name, email, timezone)
VALUES ('00000000-0000-0000-0000-000000000001', 'Adel', 'adel@outil-vie.local', 'Europe/Paris')
ON CONFLICT (id) DO NOTHING;

-- Insert default notification preferences
INSERT INTO public.notification_preferences (user_id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id) DO NOTHING;
