import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, HandlerContext } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { createAdminClient } from '@/src/infrastructure/supabase/admin';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';

/** Bloqueo "para siempre" en Supabase: se levanta poniendo 'none'. */
const BAN_DURATION = '876000h';

const updateSchema = z.object({
  nombre: z.string().min(1).optional().nullable(),
  rol: z.enum(['ADMIN', 'EMPLEADO']).optional(),
  activo: z.boolean().optional(),
  cuidadorId: z.string().uuid().optional().nullable(),
});

async function handlePATCH(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Datos inválidos', parsed.error.issues, requestId);
    }
    const cambios = parsed.data;

    const usuario = await prisma.usuario.findUnique({ where: { id: params.id } });
    if (!usuario) {
      return createErrorResponse('NOT_FOUND', 'Usuario no encontrado', undefined, requestId, 404);
    }

    // Nadie se bloquea ni se degrada a sí mismo: evita quedarse afuera.
    const esUnoMismo = usuario.id === context.auth.userId;
    if (esUnoMismo && (cambios.activo === false || (cambios.rol && cambios.rol !== 'ADMIN'))) {
      return createErrorResponse('VALIDATION_ERROR', 'No podés bloquear ni cambiar tu propio rol', undefined, requestId);
    }

    // Siempre tiene que quedar al menos un admin activo.
    const dejaDeSerAdminActivo =
      usuario.rol === 'ADMIN' && usuario.activo && (cambios.activo === false || (cambios.rol && cambios.rol !== 'ADMIN'));
    if (dejaDeSerAdminActivo) {
      const otrosAdmins = await prisma.usuario.count({
        where: { rol: 'ADMIN', activo: true, id: { not: usuario.id } },
      });
      if (otrosAdmins === 0) {
        return createErrorResponse('VALIDATION_ERROR', 'Tiene que quedar al menos un administrador activo', undefined, requestId);
      }
    }

    if (cambios.cuidadorId) {
      const cuidador = await prisma.cuidador.findUnique({ where: { id: cambios.cuidadorId } });
      if (!cuidador) {
        return createErrorResponse('NOT_FOUND', 'Cuidador no encontrado', undefined, requestId, 404);
      }
      const ocupado = await prisma.usuario.findFirst({
        where: { cuidadorId: cambios.cuidadorId, id: { not: usuario.id } },
      });
      if (ocupado) {
        return createErrorResponse('CONFLICT', 'Ese cuidador ya tiene un usuario asignado', undefined, requestId, 409);
      }
    }

    const actualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        ...(cambios.nombre !== undefined ? { nombre: cambios.nombre } : {}),
        ...(cambios.rol !== undefined ? { rol: cambios.rol } : {}),
        ...(cambios.activo !== undefined ? { activo: cambios.activo } : {}),
        ...(cambios.cuidadorId !== undefined ? { cuidadorId: cambios.cuidadorId } : {}),
      },
    });

    // Espejar en Supabase: el claim de rol lo lee el middleware y el ban corta
    // la renovación del token del usuario bloqueado.
    const admin = createAdminClient();
    const attrs: Record<string, unknown> = {};
    if (cambios.rol !== undefined) attrs.app_metadata = { rol: actualizado.rol };
    if (cambios.activo !== undefined) attrs.ban_duration = actualizado.activo ? 'none' : BAN_DURATION;
    if (Object.keys(attrs).length > 0) {
      const { error } = await admin.auth.admin.updateUserById(usuario.id, attrs);
      if (error) {
        console.error('No se pudo sincronizar el usuario en Supabase:', error.message);
        return createErrorResponse(
          'INTERNAL_ERROR',
          'El cambio se guardó, pero no se pudo sincronizar con Supabase. Reintentá.',
          error.message,
          requestId,
          500
        );
      }
    }

    await auditService.log({
      actor: context.auth.email,
      action: 'UPDATE',
      table: 'Usuario',
      recordId: usuario.id,
      oldData: { rol: usuario.rol, activo: usuario.activo, cuidadorId: usuario.cuidadorId, nombre: usuario.nombre },
      newData: { rol: actualizado.rol, activo: actualizado.activo, cuidadorId: actualizado.cuidadorId, nombre: actualizado.nombre },
      ip,
      userAgent,
    });

    return createSuccessResponse(
      {
        id: actualizado.id,
        email: actualizado.email,
        nombre: actualizado.nombre,
        rol: actualizado.rol,
        activo: actualizado.activo,
        cuidadorId: actualizado.cuidadorId,
      },
      requestId
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al actualizar usuario', message, requestId, 500);
  }
}

export const PATCH = requireAuth(handlePATCH);
