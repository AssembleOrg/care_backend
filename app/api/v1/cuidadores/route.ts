import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { CreateCuidadorUseCase } from '@/src/application/use-cases/CreateCuidadorUseCase';
import { ListCuidadoresUseCase } from '@/src/application/use-cases/ListCuidadoresUseCase';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';
import { PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from '@/src/config/constants';

const cuidadorRepository = new CuidadorRepository();

async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);
  const searchParams = request.nextUrl.searchParams;
  const all = searchParams.get('all') === 'true';
  const search = searchParams.get('search') || undefined;

  try {
    if (all) {
      // Cuando se usa all=true, devolver array simple con búsqueda opcional
      const cuidadores = await cuidadorRepository.findAll(undefined, undefined, search);
      const { plainToInstance } = await import('class-transformer');
      const { CuidadorDTO } = await import('@/src/application/dto/CuidadorDTO');
      const dtos = cuidadores.map(c => plainToInstance(CuidadorDTO, c, { excludeExtraneousValues: true }));
      return createSuccessResponse(dtos, requestId);
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || String(PAGINATION_DEFAULT_PAGE), 10));
    const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(PAGINATION_DEFAULT_LIMIT), 10)));

    const useCase = new ListCuidadoresUseCase(cuidadorRepository);
    const result = await useCase.execute(page, limit, search);
    return createSuccessResponse(result, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in handleGET cuidadores:', message);
    return createErrorResponse('INTERNAL_ERROR', 'Error al listar cuidadores', message, requestId, 500);
  }
}

async function handlePOST(request: NextRequest) {
  const requestId = getRequestId(request);
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();
    const useCase = new CreateCuidadorUseCase(cuidadorRepository);
    const result = await useCase.execute(body, { ip, userAgent });
    return createSuccessResponse(result, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    if (message.includes('Ya existe')) {
      return createErrorResponse('DUPLICATE_ERROR', message, undefined, requestId, 409);
    }
    return createErrorResponse('VALIDATION_ERROR', message || 'Error al crear cuidador', undefined, requestId, 400);
  }
}

export const GET = requireAuth(handleGET);
export const POST = requireAuth(handlePOST);
