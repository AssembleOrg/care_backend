/**
 * Backfill de roles. Todos los usuarios que ya existían en Supabase Auth
 * antes de que hubiera roles son del panel de administración, así que se
 * crean como ADMIN.
 *
 * Idempotente: si el usuario ya tiene fila en `Usuario`, sólo re-sincroniza
 * el claim `rol` en app_metadata (que es lo que lee el middleware).
 *
 * Ejecutar con: pnpm tsx --env-file=.env scripts/backfill-usuarios.ts
 */

import { prisma } from '../src/infrastructure/database/PrismaService';
import { createAdminClient } from '../src/infrastructure/supabase/admin';

async function main() {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(`No se pudieron listar los usuarios: ${error.message}`);

  const usuarios = data.users;
  console.log(`👤 ${usuarios.length} usuarios en Supabase Auth\n`);

  for (const user of usuarios) {
    const existente = await prisma.usuario.findUnique({ where: { id: user.id } });
    const rol = existente?.rol ?? 'ADMIN';

    if (!existente) {
      await prisma.usuario.create({
        data: {
          id: user.id,
          email: user.email ?? `${user.id}@sin-email.local`,
          rol,
          activo: true,
        },
      });
      console.log(`✅ creado  ${user.email} → ${rol}`);
    } else {
      console.log(`↔️  existe  ${user.email} → ${rol}`);
    }

    const { error: metaError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, rol },
    });
    if (metaError) {
      console.error(`⚠️  no se pudo actualizar app_metadata de ${user.email}: ${metaError.message}`);
    }
  }

  console.log('\n🏁 Backfill terminado');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
