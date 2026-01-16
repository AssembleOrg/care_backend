import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { PagoRepository } from '@/src/infrastructure/database/repositories/PagoRepository';
import { GetSaldosByCuidadorUseCase } from '@/src/application/use-cases/GetSaldosByCuidadorUseCase';

const pagoRepository = new PagoRepository();

async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);
  const searchParams = request.nextUrl.searchParams;
  const cuidadorId = searchParams.get('cuidadorId');
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;
  const groupByMonth = searchParams.get('groupByMonth') === 'true';

  if (!cuidadorId) {
    return createErrorResponse('VALIDATION_ERROR', 'cuidadorId es requerido', undefined, requestId, 400);
  }

  try {
    const useCase = new GetSaldosByCuidadorUseCase(pagoRepository);
    const result = await useCase.execute(cuidadorId, from, to, groupByMonth);
    return createSuccessResponse(result, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in handleGET reportes/saldos:', message);
    return createErrorResponse('INTERNAL_ERROR', 'Error al obtener saldos', message, requestId, 500);
  }
}

export const GET = requireAuth(handleGET);
