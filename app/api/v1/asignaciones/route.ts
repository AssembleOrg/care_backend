import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { AsignacionRepository } from '@/src/infrastructure/database/repositories/AsignacionRepository';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { PersonaAsistidaRepository } from '@/src/infrastructure/database/repositories/PersonaAsistidaRepository';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { AsignacionDTO } from '@/src/application/dto/AsignacionDTO';
import { plainToInstance } from 'class-transformer';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';
import { PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from '@/src/config/constants';
import { z } from 'zod';
import { HorarioValidationService, Horario } from '@/src/application/services/HorarioValidationService';
import { prisma } from '@/src/infrastructure/database/PrismaService';

const asignacionRepository = new AsignacionRepository();
const cuidadorRepository = new CuidadorRepository();
const personaRepository = new PersonaAsistidaRepository();

const horarioSchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/),
});

const createSchema = z.object({
  cuidadorId: z.string().uuid(),
  personaId: z.string().uuid(),
  precioPorHora: z.number().positive(),
  fechaInicio: z.coerce.date(),
  fechaFin: z.coerce.date().optional(),
  horarios: z.array(horarioSchema).min(1),
  notas: z.string().optional(),
});

async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);
  const searchParams = request.nextUrl.searchParams;
  const all = searchParams.get('all') === 'true';
  const cuidadorId = searchParams.get('cuidadorId');

  try {
    // Obtener cuidadores y personas para incluir nombres
    const [cuidadoresData, personasData] = await Promise.all([
      cuidadorRepository.findAll(),
      personaRepository.findAll(),
    ]);
    
    const cuidadoresMap = new Map(cuidadoresData.map(c => [c.id, c.nombreCompleto]));
    const personasMap = new Map(personasData.map(p => [p.id, p.nombreCompleto]));

    if (all) {
      let asignaciones = await asignacionRepository.findAll();
      
      // Filtrar por cuidador si se proporciona
      if (cuidadorId) {
        asignaciones = asignaciones.filter(a => a.cuidadorId === cuidadorId);
      }
      
      const dtos = asignaciones.map(a => {
        const dto = plainToInstance(AsignacionDTO, a, { excludeExtraneousValues: true });
        return {
          ...dto,
          cuidadorNombre: cuidadoresMap.get(a.cuidadorId) || '',
          personaNombre: personasMap.get(a.personaId) || '',
        };
      });
      return createSuccessResponse(dtos, requestId);
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || String(PAGINATION_DEFAULT_PAGE), 10));
    const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(PAGINATION_DEFAULT_LIMIT), 10)));

    // Obtener todas las asignaciones para filtrar
    let asignaciones = await asignacionRepository.findAll();
    
    // Filtrar por cuidador si se proporciona
    if (cuidadorId) {
      asignaciones = asignaciones.filter(a => a.cuidadorId === cuidadorId);
    }
    
    // Aplicar paginación después del filtro
    const total = asignaciones.length;
    const start = (page - 1) * limit;
    const asignacionesPaginated = asignaciones.slice(start, start + limit);

    const dtos = asignacionesPaginated.map(a => {
      const dto = plainToInstance(AsignacionDTO, a, { excludeExtraneousValues: true });
      return {
        ...dto,
        cuidadorNombre: cuidadoresMap.get(a.cuidadorId) || '',
        personaNombre: personasMap.get(a.personaId) || '',
      };
    });

    return createSuccessResponse({
      data: dtos,
      total,
      page,
      limit,
    }, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in handleGET asignaciones:', message);
    return createErrorResponse('INTERNAL_ERROR', 'Error al listar asignaciones', message, requestId, 500);
  }
}

async function handlePOST(request: NextRequest) {
  const requestId = getRequestId(request);
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();
    const validated = createSchema.parse(body);

    // Verify cuidador and persona exist
    const [cuidador, persona] = await Promise.all([
      cuidadorRepository.findById(validated.cuidadorId),
      personaRepository.findById(validated.personaId),
    ]);

    if (!cuidador) {
      return createErrorResponse('NOT_FOUND', 'Cuidador no encontrado', undefined, requestId, 404);
    }

    if (!persona) {
      return createErrorResponse('NOT_FOUND', 'Persona asistida no encontrada', undefined, requestId, 404);
    }

    // Validar que no se superpongan horarios con otras asignaciones del mismo cuidador
    const asignacionesExistentes = await prisma.asignacion.findMany({
      where: {
        cuidadorId: validated.cuidadorId,
        fechaFin: null, // Solo asignaciones activas
      },
    });

    // Extraer solo los horarios de las asignaciones existentes
    const horariosExistentes = asignacionesExistentes.map((a: { horarios: unknown }) => ({
      horarios: (Array.isArray(a.horarios) ? (a.horarios as unknown as Horario[]) : []),
    }));

    const validacion = HorarioValidationService.validarSuperposicion(
      validated.horarios as Horario[],
      horariosExistentes
    );

    if (!validacion.valido) {
      return createErrorResponse('VALIDATION_ERROR', validacion.error || 'Error de validación de horarios', undefined, requestId, 400);
    }

    const asignacion = await asignacionRepository.create({
      cuidadorId: validated.cuidadorId,
      personaId: validated.personaId,
      precioPorHora: validated.precioPorHora,
      fechaInicio: validated.fechaInicio,
      fechaFin: validated.fechaFin || null,
      horarios: validated.horarios,
      notas: validated.notas || null,
    });

    // Audit
    await auditService.log({
      actor: 'ADMIN',
      action: 'CREATE',
      table: 'Asignacion',
      recordId: asignacion.id,
      newData: { cuidadorId: validated.cuidadorId, personaId: validated.personaId },
      ip,
      userAgent,
    });

    const dto = plainToInstance(AsignacionDTO, asignacion, { excludeExtraneousValues: true });

    return createSuccessResponse(dto, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('VALIDATION_ERROR', message, undefined, requestId, 400);
  }
}

export const GET = requireAuth(handleGET);
export const POST = requireAuth(handlePOST);
