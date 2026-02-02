import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth, HandlerContext } from '@/src/presentation/middleware/auth';
import { PersonaCuidadorRepository } from '@/src/infrastructure/database/repositories/PersonaCuidadorRepository';
import { PersonaAsistidaRepository } from '@/src/infrastructure/database/repositories/PersonaAsistidaRepository';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';

const personaCuidadorRepository = new PersonaCuidadorRepository();
const personaRepository = new PersonaAsistidaRepository();

async function handleDELETE(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string; cuidadorId: string };
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const persona = await personaRepository.findById(params.id);
    if (!persona) {
      return createErrorResponse('NOT_FOUND', 'Persona asistida no encontrada', undefined, requestId, 404);
    }

    // Buscar todas las relaciones activas de esta persona
    const relacionesActivas = await personaCuidadorRepository.findActivosByPersonaId(params.id);
    
    // Verificar que no sea el último cuidador activo
    const relacionesConEsteCuidador = relacionesActivas.filter(r => r.cuidadorId === params.cuidadorId);
    
    if (relacionesConEsteCuidador.length === 0) {
      return createErrorResponse('NOT_FOUND', 'No se encontró una relación activa con este cuidador', undefined, requestId, 404);
    }

    // Si es el único cuidador activo, no permitir eliminarlo
    if (relacionesActivas.length === 1 && relacionesActivas[0].cuidadorId === params.cuidadorId) {
      return createErrorResponse('VALIDATION_ERROR', 'No se puede eliminar el último cuidador activo. Una persona debe tener al menos un cuidador.', undefined, requestId, 400);
    }

    // Marcar como inactivo en lugar de eliminar
    for (const relacion of relacionesConEsteCuidador) {
      await personaCuidadorRepository.update(relacion.id, {
        activo: false,
        fechaFin: new Date(),
      });

      // Audit
      await auditService.log({
        actor: 'ADMIN',
        action: 'UPDATE',
        table: 'PersonaCuidador',
        recordId: relacion.id,
        oldData: { activo: true },
        newData: { activo: false, fechaFin: new Date() },
        ip,
        userAgent,
      });
    }

    return createSuccessResponse({ message: 'Cuidador desasignado correctamente' }, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al desasignar cuidador', message, requestId, 500);
  }
}

export const DELETE = requireAuth(handleDELETE);
