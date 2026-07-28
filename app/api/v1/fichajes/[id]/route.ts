import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, HandlerContext } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';

const schema = z.object({
  revision: z.enum(['APROBADO', 'RECHAZADO', 'PENDIENTE']),
  notaRevision: z.string().max(500).optional().nullable(),
});

/** Dani aprueba o rechaza un fichaje que quedó fuera del radio. */
async function handlePATCH(request: NextRequest, context: HandlerContext) {
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

    const fichaje = await prisma.fichaje.findUnique({ where: { id: params.id } });
    if (!fichaje) {
      return createErrorResponse('NOT_FOUND', 'Fichaje no encontrado', undefined, requestId, 404);
    }

    const actualizado = await prisma.fichaje.update({
      where: { id: fichaje.id },
      data: {
        revision: parsed.data.revision,
        notaRevision: parsed.data.notaRevision ?? null,
        revisadoPorId: context.auth.userId,
        revisadoAt: new Date(),
      },
    });

    await auditService.log({
      actor: context.auth.email,
      action: 'UPDATE',
      table: 'Fichaje',
      recordId: fichaje.id,
      oldData: { revision: fichaje.revision },
      newData: { revision: actualizado.revision, notaRevision: actualizado.notaRevision },
      ip,
      userAgent,
    });

    return createSuccessResponse({ id: actualizado.id, revision: actualizado.revision }, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al revisar el fichaje', message, requestId, 500);
  }
}

export const PATCH = requireAuth(handlePATCH);
