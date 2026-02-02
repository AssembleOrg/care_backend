import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth, HandlerContext } from '@/src/presentation/middleware/auth';
import { PersonaCuidadorRepository } from '@/src/infrastructure/database/repositories/PersonaCuidadorRepository';
import { PersonaAsistidaRepository } from '@/src/infrastructure/database/repositories/PersonaAsistidaRepository';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';
import { z } from 'zod';

const personaCuidadorRepository = new PersonaCuidadorRepository();
const personaRepository = new PersonaAsistidaRepository();
const cuidadorRepository = new CuidadorRepository();

const createSchema = z.object({
  cuidadorId: z.string().uuid(),
  fechaInicio: z.coerce.date().optional(),
  activo: z.boolean().optional().default(true),
});

async function handleGET(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };

  try {
    const persona = await personaRepository.findById(params.id);
    if (!persona) {
      return createErrorResponse('NOT_FOUND', 'Persona asistida no encontrada', undefined, requestId, 404);
    }

    const relaciones = await personaCuidadorRepository.findByPersonaId(params.id);
    
    // Obtener nombres de cuidadores
    const cuidadoresData = await cuidadorRepository.findAll();
    const cuidadoresMap = new Map(cuidadoresData.map(c => [c.id, c.nombreCompleto]));

    const relacionesConNombres = relaciones.map(r => ({
      id: r.id,
      cuidadorId: r.cuidadorId,
      cuidadorNombre: cuidadoresMap.get(r.cuidadorId) || '',
      fechaInicio: r.fechaInicio.toISOString(),
      fechaFin: r.fechaFin?.toISOString() || null,
      activo: r.activo,
    }));

    return createSuccessResponse(relacionesConNombres, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al obtener cuidadores', message, requestId, 500);
  }
}

async function handlePOST(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const persona = await personaRepository.findById(params.id);
    if (!persona) {
      return createErrorResponse('NOT_FOUND', 'Persona asistida no encontrada', undefined, requestId, 404);
    }

    const body = await request.json();
    const validated = createSchema.parse(body);

    const cuidador = await cuidadorRepository.findById(validated.cuidadorId);
    if (!cuidador) {
      return createErrorResponse('NOT_FOUND', 'Cuidador no encontrado', undefined, requestId, 404);
    }

    // Verificar que no exista ya una relación activa con este cuidador
    const relacionesExistentes = await personaCuidadorRepository.findByPersonaId(params.id);
    const relacionActiva = relacionesExistentes.find(
      r => r.cuidadorId === validated.cuidadorId && r.activo && (!r.fechaFin || r.fechaFin >= new Date())
    );

    if (relacionActiva) {
      return createErrorResponse('DUPLICATE_ERROR', 'Este cuidador ya está asignado a esta persona', undefined, requestId, 409);
    }

    const relacion = await personaCuidadorRepository.create({
      personaId: params.id,
      cuidadorId: validated.cuidadorId,
      fechaInicio: validated.fechaInicio || new Date(),
      fechaFin: null,
      activo: validated.activo,
    });

    // Audit
    await auditService.log({
      actor: 'ADMIN',
      action: 'CREATE',
      table: 'PersonaCuidador',
      recordId: relacion.id,
      newData: { personaId: params.id, cuidadorId: validated.cuidadorId },
      ip,
      userAgent,
    });

    return createSuccessResponse({
      id: relacion.id,
      cuidadorId: relacion.cuidadorId,
      cuidadorNombre: cuidador.nombreCompleto,
      fechaInicio: relacion.fechaInicio.toISOString(),
      fechaFin: relacion.fechaFin?.toISOString() || null,
      activo: relacion.activo,
    }, requestId);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Datos inválidos', error.issues, requestId, 400);
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al asignar cuidador', message, requestId, 500);
  }
}

export const GET = requireAuth(handleGET);
export const POST = requireAuth(handlePOST);
