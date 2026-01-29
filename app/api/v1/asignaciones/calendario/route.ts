import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { AsignacionRepository } from '@/src/infrastructure/database/repositories/AsignacionRepository';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { PersonaAsistidaRepository } from '@/src/infrastructure/database/repositories/PersonaAsistidaRepository';
import { AsignacionDTO } from '@/src/application/dto/AsignacionDTO';
import { plainToInstance } from 'class-transformer';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);
dayjs.locale('es');

const asignacionRepository = new AsignacionRepository();
const cuidadorRepository = new CuidadorRepository();
const personaRepository = new PersonaAsistidaRepository();

async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);
  const searchParams = request.nextUrl.searchParams;
  
  // Filtros: semana (fecha de inicio de semana) y cuidadorId
  const semanaParam = searchParams.get('semana');
  const cuidadorId = searchParams.get('cuidadorId');

  try {
    // Obtener cuidadores y personas para incluir nombres
    const [cuidadoresData, personasData] = await Promise.all([
      cuidadorRepository.findAll(),
      personaRepository.findAll(),
    ]);
    
    const cuidadoresMap = new Map(cuidadoresData.map(c => [c.id, c.nombreCompleto]));
    const personasMap = new Map(personasData.map(p => [p.id, p.nombreCompleto]));

    // Calcular rango de la semana
    let inicioSemana: dayjs.Dayjs;
    let finSemana: dayjs.Dayjs;

    if (semanaParam) {
      inicioSemana = dayjs(semanaParam).startOf('isoWeek');
      finSemana = dayjs(semanaParam).endOf('isoWeek');
    } else {
      // Si no se proporciona semana, usar la semana actual
      inicioSemana = dayjs().startOf('isoWeek');
      finSemana = dayjs().endOf('isoWeek');
    }

    // Obtener todas las asignaciones (sin paginación, pero filtradas)
    let asignaciones = await asignacionRepository.findAll();

    // Filtrar por cuidador si se proporciona
    if (cuidadorId) {
      asignaciones = asignaciones.filter(a => a.cuidadoresIds.includes(cuidadorId));
    }

    // Filtrar asignaciones que intersectan con la semana
    const asignacionesFiltradas = asignaciones.filter(a => {
      const fechaInicio = dayjs(a.fechaInicio);
      const fechaFin = a.fechaFin ? dayjs(a.fechaFin) : null;
      
      // La asignación intersecta con la semana si:
      // - La fecha de inicio es antes o igual al fin de semana Y
      // - No tiene fecha fin O la fecha fin es después o igual al inicio de semana
      return fechaInicio.isBefore(finSemana.add(1, 'day')) && 
             (!fechaFin || fechaFin.isAfter(inicioSemana.subtract(1, 'day')));
    });

    const dtos = asignacionesFiltradas.map(a => {
      const dto = plainToInstance(AsignacionDTO, a, { excludeExtraneousValues: true });
      const cuidadoresNombres = a.cuidadoresIds.map(id => cuidadoresMap.get(id) || '').filter(Boolean);
      return {
        ...dto,
        cuidadoresNombres,
        personaNombre: personasMap.get(a.personaId) || '',
      };
    });

    return createSuccessResponse(dtos, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in handleGET asignaciones calendario:', message);
    return createErrorResponse('INTERNAL_ERROR', 'Error al listar asignaciones del calendario', message, requestId, 500);
  }
}

export const GET = requireAuth(handleGET);
