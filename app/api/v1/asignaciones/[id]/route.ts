import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth, HandlerContext } from '@/src/presentation/middleware/auth';
import { AsignacionRepository } from '@/src/infrastructure/database/repositories/AsignacionRepository';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { PersonaAsistidaRepository } from '@/src/infrastructure/database/repositories/PersonaAsistidaRepository';
import { plainToInstance } from 'class-transformer';
import { AsignacionDTO } from '@/src/application/dto/AsignacionDTO';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { z } from 'zod';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';

const asignacionRepository = new AsignacionRepository();
const cuidadorRepository = new CuidadorRepository();
const personaRepository = new PersonaAsistidaRepository();

const cuidadorAsignacionSchema = z.object({
  horas: z.number().positive(),
  precioPorHora: z.number().positive(),
});

const updateSchema = z.object({
  cuidadoresIds: z.array(z.string().uuid()).min(1).optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().nullable().optional(),
  horasPorCuidador: z.record(z.string().uuid(), cuidadorAsignacionSchema).optional(),
  notas: z.string().nullable().optional(),
});

async function handleGET(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };

  try {
    const asignacion = await asignacionRepository.findById(params.id);
    if (!asignacion) {
      return createErrorResponse('NOT_FOUND', 'Asignación no encontrada', undefined, requestId, 404);
    }

    // Obtener nombres
    const [cuidadoresData, persona] = await Promise.all([
      Promise.all(asignacion.cuidadoresIds.map(id => cuidadorRepository.findById(id))),
      personaRepository.findById(asignacion.personaId),
    ]);

    const cuidadoresNombres = cuidadoresData
      .filter(c => c !== null)
      .map(c => c!.nombreCompleto);

    const dto = plainToInstance(AsignacionDTO, asignacion, { excludeExtraneousValues: true });

    return createSuccessResponse({
      ...dto,
      cuidadoresNombres,
      personaNombre: persona?.nombreCompleto || '',
    }, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al obtener asignación', message, requestId, 500);
  }
}

async function handlePUT(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const asignacionExistente = await asignacionRepository.findById(params.id);
    if (!asignacionExistente) {
      return createErrorResponse('NOT_FOUND', 'Asignación no encontrada', undefined, requestId, 404);
    }

    const body = await request.json();
    const validated = updateSchema.parse(body);

    // Si se actualizan cuidadores, verificar que existan
    if (validated.cuidadoresIds) {
      const cuidadores = await Promise.all(
        validated.cuidadoresIds.map(id => cuidadorRepository.findById(id))
      );
      const cuidadoresNoEncontrados = cuidadores.filter(c => !c);
      if (cuidadoresNoEncontrados.length > 0) {
        return createErrorResponse('NOT_FOUND', 'Uno o más cuidadores no fueron encontrados', undefined, requestId, 404);
      }
    }


    const asignacionActualizada = await asignacionRepository.update(params.id, {
      cuidadoresIds: validated.cuidadoresIds,
      fechaInicio: validated.fechaInicio,
      fechaFin: validated.fechaFin,
      horarios: null,
      horasPorCuidador: validated.horasPorCuidador,
      notas: validated.notas,
    });

    // Audit
    await auditService.log({
      actor: 'ADMIN',
      action: 'UPDATE',
      table: 'Asignacion',
      recordId: params.id,
      oldData: { horasPorCuidador: asignacionExistente.horasPorCuidador },
      newData: { horasPorCuidador: validated.horasPorCuidador },
      ip,
      userAgent,
    });

    const dto = plainToInstance(AsignacionDTO, asignacionActualizada, { excludeExtraneousValues: true });

    return createSuccessResponse(dto, requestId);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Datos inválidos', error.issues, requestId, 400);
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al actualizar asignación', message, requestId, 500);
  }
}

async function handleDELETE(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const asignacion = await asignacionRepository.findById(params.id);
    if (!asignacion) {
      return createErrorResponse('NOT_FOUND', 'Asignación no encontrada', undefined, requestId, 404);
    }

    await asignacionRepository.delete(params.id);

    // Audit
    await auditService.log({
      actor: 'ADMIN',
      action: 'DELETE',
      table: 'Asignacion',
      recordId: params.id,
      oldData: { cuidadoresIds: asignacion.cuidadoresIds, personaId: asignacion.personaId },
      ip,
      userAgent,
    });

    return createSuccessResponse({ message: 'Asignación eliminada' }, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al eliminar asignación', message, requestId, 500);
  }
}

export const GET = requireAuth(handleGET);
export const PUT = requireAuth(handlePUT);
export const DELETE = requireAuth(handleDELETE);
