-- Realtime para formularios públicos (MensajeContacto, SolicitudEmpleo).
-- Prisma conecta con un rol directo que BYPASSA RLS, así que habilitar RLS
-- acá no afecta el acceso del backend vía Prisma.

-- 1. Habilitar Row Level Security
ALTER TABLE "MensajeContacto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SolicitudEmpleo" ENABLE ROW LEVEL SECURITY;

-- 2. Policy SELECT para usuarios autenticados.
--    Requerido por Supabase Realtime (postgres_changes respeta RLS).
DROP POLICY IF EXISTS "authenticated_select_mensaje_contacto" ON "MensajeContacto";
CREATE POLICY "authenticated_select_mensaje_contacto" ON "MensajeContacto"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_select_solicitud_empleo" ON "SolicitudEmpleo";
CREATE POLICY "authenticated_select_solicitud_empleo" ON "SolicitudEmpleo"
  FOR SELECT TO authenticated USING (true);

-- 3. Agregar tablas a la publication de Realtime.
ALTER PUBLICATION supabase_realtime ADD TABLE "MensajeContacto";
ALTER PUBLICATION supabase_realtime ADD TABLE "SolicitudEmpleo";
