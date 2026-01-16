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
import { HorarioValidationService, Horario } from '@/src/application/services/HorarioValidationService';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';

const asignacionRepository = new AsignacionRepository();
const cuidadorRepository = new CuidadorRepository();
const personaRepository = new PersonaAsistidaRepository();

const horarioSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/),
});

const updateSchema = z.object({
  precioPorHora: z.number().positive().optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().nullable().optional(),
  horarios: z.array(horarioSchema).min(1).optional(),
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
    const [cuidador, persona] = await Promise.all([
      cuidadorRepository.findById(asignacion.cuidadorId),
      personaRepository.findById(asignacion.personaId),
    ]);

    const dto = plainToInstance(AsignacionDTO, asignacion, { excludeExtraneousValues: true });

    return createSuccessResponse({
      ...dto,
      cuidadorNombre: cuidador?.nombreCompleto || '',
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

    // Si se actualizan horarios, validar superposición
    if (validated.horarios) {
      const asignacionesDelCuidador = await prisma.asignacion.findMany({
        where: {
          cuidadorId: asignacionExistente.cuidadorId,
          fechaFin: null,
          id: { not: params.id }, // Excluir la asignación actual
        },
      });

      const horariosExistentes = asignacionesDelCuidador.map((a: { horarios: unknown }) => ({
        horarios: (Array.isArray(a.horarios) ? (a.horarios as unknown as Horario[]) : []),
      }));

      const validacion = HorarioValidationService.validarSuperposicion(
        validated.horarios as Horario[],
        horariosExistentes
      );

      if (!validacion.valido) {
        return createErrorResponse('VALIDATION_ERROR', validacion.error || 'Error de validación de horarios', undefined, requestId, 400);
      }
    }

    const asignacionActualizada = await asignacionRepository.update(params.id, {
      precioPorHora: validated.precioPorHora,
      fechaInicio: validated.fechaInicio,
      fechaFin: validated.fechaFin,
      horarios: validated.horarios,
      notas: validated.notas,
    });

    // Audit
    await auditService.log({
      actor: 'ADMIN',
      action: 'UPDATE',
      table: 'Asignacion',
      recordId: params.id,
      oldData: { precioPorHora: asignacionExistente.precioPorHora },
      newData: { precioPorHora: validated.precioPorHora },
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
      oldData: { cuidadorId: asignacion.cuidadorId, personaId: asignacion.personaId },
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
