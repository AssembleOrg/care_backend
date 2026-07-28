import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, HandlerContext } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { createAdminClient } from '@/src/infrastructure/supabase/admin';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';

const schema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

/** Cambio de contraseña hecho por un admin (no pide la contraseña anterior). */
async function handlePOST(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Datos inválidos', parsed.error.issues, requestId);
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: params.id } });
    if (!usuario) {
      return createErrorResponse('NOT_FOUND', 'Usuario no encontrado', undefined, requestId, 404);
    }

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(usuario.id, { password: parsed.data.password });
    if (error) {
      return createErrorResponse('INTERNAL_ERROR', error.message, undefined, requestId, 500);
    }

    await auditService.log({
      actor: context.auth.email,
      action: 'UPDATE',
      table: 'Usuario',
      recordId: usuario.id,
      newData: { password: 'cambiada' },
      ip,
      userAgent,
    });

    return createSuccessResponse({ id: usuario.id, actualizado: true }, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al cambiar la contraseña', message, requestId, 500);
  }
}

export const POST = requireAuth(handlePOST);
