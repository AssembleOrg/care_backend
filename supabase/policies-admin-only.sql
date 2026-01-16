-- CareByDani - Row Level Security Policies
-- Solo el admin específico puede acceder a los datos
-- Ejecutar este archivo en el SQL Editor de Supabase
-- IMPORTANTE: Reemplazar '72769ed3-610f-43a4-9e3a-56140fbf4f55' con tu UUID de admin si es diferente

-- Habilitar RLS en todas las tablas
ALTER TABLE "Cuidador" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PersonaAsistida" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Asignacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReciboAdjunto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Admin" ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Only admin can access Cuidador" ON "Cuidador";
DROP POLICY IF EXISTS "Only admin can access PersonaAsistida" ON "PersonaAsistida";
DROP POLICY IF EXISTS "Only admin can access Asignacion" ON "Asignacion";
DROP POLICY IF EXISTS "Only admin can access Pago" ON "Pago";
DROP POLICY IF EXISTS "Only admin can access ReciboAdjunto" ON "ReciboAdjunto";
DROP POLICY IF EXISTS "Only admin can read AuditLog" ON "AuditLog";
DROP POLICY IF EXISTS "Service role can insert AuditLog" ON "AuditLog";
DROP POLICY IF EXISTS "Only admin can read Admin" ON "Admin";

-- Políticas para Cuidador - Solo el admin específico
CREATE POLICY "Only admin can access Cuidador" ON "Cuidador"
  FOR ALL TO authenticated
  USING (auth.uid() = '72769ed3-610f-43a4-9e3a-56140fbf4f55'::uuid)
  WITH CHECK (auth.uid() = '72769ed3-610f-43a4-9e3a-56140fbf4f55'::uuid);

-- Políticas para PersonaAsistida - Solo el admin específico
CREATE POLICY "Only admin can access PersonaAsistida" ON "PersonaAsistida"
  FOR ALL TO authenticated
  USING (auth.uid() = '72769ed3-610f-43a4-9e3a-56140fbf4f55'::uuid)
  WITH CHECK (auth.uid() = '72769ed3-610f-43a4-9e3a-56140fbf4f55'::uuid);

-- Políticas para Asignacion - Solo el admin específico
CREATE POLICY "Only admin can access Asignacion" ON "Asignacion"
  FOR ALL TO authenticated
  USING (auth.uid() = '72769ed3-610f-43a4-9e3a-56140fbf4f55'::uuid)
  WITH CHECK (auth.uid() = '72769ed3-610f-43a4-9e3a-56140fbf4f55'::uuid);

-- Políticas para Pago - Solo el admin específico
CREATE POLICY "Only admin can access Pago" ON "Pago"
  FOR ALL TO authenticated
  USING (auth.uid() = '72769ed3-610f-43a4-9e3a-56140fbf4f55'::uuid)
  WITH CHECK (auth.uid() = '72769ed3-610f-43a4-9e3a-56140fbf4f55'::uuid);

-- Políticas para ReciboAdjunto - Solo el admin específico
CREATE POLICY "Only admin can access ReciboAdjunto" ON "ReciboAdjunto"
  FOR ALL TO authenticated
  USING (auth.uid() = '72769ed3-610f-43a4-9e3a-56140fbf4f55'::uuid)
  WITH CHECK (auth.uid() = '72769ed3-610f-43a4-9e3a-56140fbf4f55'::uuid);

-- Políticas para AuditLog - Solo lectura para el admin
CREATE POLICY "Only admin can read AuditLog" ON "AuditLog"
  FOR SELECT TO authenticated
  USING (auth.uid() = '72769ed3-610f-43a4-9e3a-56140fbf4f55'::uuid);

-- Las inserciones de AuditLog se hacen con service_role (desde Prisma)
CREATE POLICY "Service role can insert AuditLog" ON "AuditLog"
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Admin - Solo lectura para el admin específico
CREATE POLICY "Only admin can read Admin" ON "Admin"
  FOR SELECT TO authenticated
  USING (auth.uid() = '72769ed3-610f-43a4-9e3a-56140fbf4f55'::uuid);

-- Verificar las políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('Cuidador', 'PersonaAsistida', 'Asignacion', 'Pago', 'ReciboAdjunto', 'AuditLog', 'Admin')
ORDER BY tablename, policyname;
