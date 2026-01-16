import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { PagoRepository } from '@/src/infrastructure/database/repositories/PagoRepository';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { PersonaAsistidaRepository } from '@/src/infrastructure/database/repositories/PersonaAsistidaRepository';
import { CreatePagoUseCase } from '@/src/application/use-cases/CreatePagoUseCase';
import { PagoDTO } from '@/src/application/dto/PagoDTO';
import { plainToInstance } from 'class-transformer';
import { PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from '@/src/config/constants';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';

const pagoRepository = new PagoRepository();
const cuidadorRepository = new CuidadorRepository();
const personaRepository = new PersonaAsistidaRepository();

async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || String(PAGINATION_DEFAULT_PAGE), 10));
  const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(PAGINATION_DEFAULT_LIMIT), 10)));
  const all = searchParams.get('all') === 'true';
  const cuidadorId = searchParams.get('cuidadorId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    // Obtener cuidadores para incluir nombres
    const cuidadoresData = await cuidadorRepository.findAll();
    const cuidadoresMap = new Map(cuidadoresData.map(c => [c.id, c.nombreCompleto]));

    let pagos;
    
    if (cuidadorId) {
      // Filtrar por cuidador (y opcionalmente por fechas)
      const fromDate = from ? new Date(from) : undefined;
      const toDate = to ? new Date(to) : undefined;
      pagos = await pagoRepository.findByCuidadorId(cuidadorId, fromDate, toDate);
    } else if (all) {
      pagos = await pagoRepository.findAll();
    } else {
      const [pagosPaginated, total] = await Promise.all([
        pagoRepository.findAll((page - 1) * limit, limit),
        pagoRepository.count(),
      ]);

      const dtos = pagosPaginated.map(p => ({
        ...plainToInstance(PagoDTO, p, { excludeExtraneousValues: true }),
        cuidadorNombre: cuidadoresMap.get(p.cuidadorId) || '',
      }));

      return createSuccessResponse({
        data: dtos,
        total,
        page,
        limit,
      }, requestId);
    }

    // Filtrar por fechas si se proporcionaron (para el caso de all=true sin cuidadorId)
    if (!cuidadorId && (from || to)) {
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      pagos = pagos.filter(p => {
        const fecha = new Date(p.fecha);
        if (fromDate && fecha < fromDate) return false;
        if (toDate && fecha > toDate) return false;
        return true;
      });
    }

    const dtos = pagos.map(p => ({
      ...plainToInstance(PagoDTO, p, { excludeExtraneousValues: true }),
      cuidadorNombre: cuidadoresMap.get(p.cuidadorId) || '',
    }));
    
    return createSuccessResponse(dtos, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in handleGET pagos:', message);
    return createErrorResponse('INTERNAL_ERROR', 'Error al listar pagos', message, requestId, 500);
  }
}

async function handlePOST(request: NextRequest) {
  const requestId = getRequestId(request);
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();
    const useCase = new CreatePagoUseCase(pagoRepository, cuidadorRepository, personaRepository);
    const result = await useCase.execute(body, { ip, userAgent });
    return createSuccessResponse(result, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    if (message.includes('no encontrado')) {
      return createErrorResponse('NOT_FOUND', message, undefined, requestId, 404);
    }
    return createErrorResponse('VALIDATION_ERROR', message || 'Error al crear pago', undefined, requestId, 400);
  }
}

export const GET = requireAuth(handleGET);
export const POST = requireAuth(handlePOST);
