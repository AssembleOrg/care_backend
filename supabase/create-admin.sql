-- Script para crear el usuario admin en Supabase Auth
-- Ejecutar en el SQL Editor de Supabase
-- IMPORTANTE: Reemplazar 'Admin123!' con una contraseña segura

-- Crear usuario admin con ID específico
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_sent_at,
  recovery_sent_at,
  email_change_sent_at,
  last_sign_in_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  confirmed_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '72769ed3-610f-43a4-9e3a-56140fbf4f55',
  'authenticated',
  'authenticated',
  'admin@carebydani.com',
  crypt('Admin123!', gen_salt('bf')), -- Cambiar esta contraseña
  NOW(),
  '2026-01-16 02:41:16.240964+00',
  '2026-01-16 02:41:16.280014+00',
  '',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{"email_verified": true}',
  false,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '',
  '',
  NULL,
  '2026-01-16 02:41:16.272724+00',
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Verificar que se creó correctamente
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE id = '72769ed3-610f-43a4-9e3a-56140fbf4f55';
