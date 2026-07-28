import { NextRequest } from 'next/server';
import { requireCuidador, HandlerContext } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { horasEntre } from '@/src/domain/tiempo';

const LIMITE_DEFAULT = 10;
const LIMITE_MAXIMO = 50;

/** Historial propio del cuidador, paginado. */
async function handleGET(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const { cuidadorId } = context.auth;

  if (!cuidadorId) {
    return createErrorResponse('SIN_CUIDADOR', 'Tu usuario no está vinculado a un cuidador', undefined, requestId, 409);
  }

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
  const limit = Math.min(LIMITE_MAXIMO, Math.max(1, parseInt(sp.get('limit') || String(LIMITE_DEFAULT), 10) || LIMITE_DEFAULT));

  try {
    // Sólo turnos cerrados: el abierto ya se muestra arriba de la pantalla.
    const where = { cuidadorId, salidaAt: { not: null } };

    const [fichajes, total] = await Promise.all([
      prisma.fichaje.findMany({
        where,
        include: { persona: { select: { nombreCompleto: true } } },
        orderBy: { entradaAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fichaje.count({ where }),
    ]);

    return createSuccessResponse(
      {
        data: fichajes.map((f) => ({
          id: f.id,
          personaNombre: f.persona.nombreCompleto,
          entradaAt: f.entradaAt.toISOString(),
          salidaAt: f.salidaAt!.toISOString(),
          horas: horasEntre(f.entradaAt, f.salidaAt!),
          revision: f.revision,
          notaRevision: f.notaRevision,
        })),
        total,
        page,
        limit,
      },
      requestId
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al cargar tu historial', message, requestId, 500);
  }
}

export const GET = requireCuidador(handleGET);
