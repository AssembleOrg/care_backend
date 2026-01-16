-- CareByDani - Supabase Row Level Security Policies
-- Ejecutar este archivo en el SQL Editor de Supabase

-- Nota: Las tablas de Prisma no usan RLS por defecto porque se conectan
-- con el service_role key. Estas políticas son opcionales si querés
-- agregar una capa extra de seguridad.

-- Habilitar RLS en todas las tablas
ALTER TABLE "Cuidador" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PersonaAsistida" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Asignacion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pago" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReciboAdjunto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Admin" ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios autenticados (rol 'authenticated')
-- Solo usuarios autenticados pueden leer/escribir

-- Cuidador
CREATE POLICY "Allow authenticated read on Cuidador" ON "Cuidador"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on Cuidador" ON "Cuidador"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on Cuidador" ON "Cuidador"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on Cuidador" ON "Cuidador"
  FOR DELETE TO authenticated USING (true);

-- PersonaAsistida
CREATE POLICY "Allow authenticated read on PersonaAsistida" ON "PersonaAsistida"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on PersonaAsistida" ON "PersonaAsistida"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on PersonaAsistida" ON "PersonaAsistida"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on PersonaAsistida" ON "PersonaAsistida"
  FOR DELETE TO authenticated USING (true);

-- Asignacion
CREATE POLICY "Allow authenticated read on Asignacion" ON "Asignacion"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on Asignacion" ON "Asignacion"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on Asignacion" ON "Asignacion"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on Asignacion" ON "Asignacion"
  FOR DELETE TO authenticated USING (true);

-- Pago
CREATE POLICY "Allow authenticated read on Pago" ON "Pago"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on Pago" ON "Pago"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on Pago" ON "Pago"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on Pago" ON "Pago"
  FOR DELETE TO authenticated USING (true);

-- ReciboAdjunto
CREATE POLICY "Allow authenticated read on ReciboAdjunto" ON "ReciboAdjunto"
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on ReciboAdjunto" ON "ReciboAdjunto"
  FOR INSERT TO authenticated WITH CHECK (true);

-- AuditLog - Solo lectura para usuarios autenticados
CREATE POLICY "Allow authenticated read on AuditLog" ON "AuditLog"
  FOR SELECT TO authenticated USING (true);

-- Las inserciones de AuditLog se hacen con service_role
CREATE POLICY "Allow service insert on AuditLog" ON "AuditLog"
  FOR INSERT TO service_role WITH CHECK (true);

-- Admin - Solo lectura para service_role
CREATE POLICY "Allow service read on Admin" ON "Admin"
  FOR SELECT TO service_role USING (true);

-- Permitir que el service_role bypass RLS para todas las operaciones
-- Esto es necesario para que Prisma funcione correctamente
GRANT ALL ON "Cuidador" TO service_role;
GRANT ALL ON "PersonaAsistida" TO service_role;
GRANT ALL ON "Asignacion" TO service_role;
GRANT ALL ON "Pago" TO service_role;
GRANT ALL ON "ReciboAdjunto" TO service_role;
GRANT ALL ON "AuditLog" TO service_role;
GRANT ALL ON "Admin" TO service_role;
