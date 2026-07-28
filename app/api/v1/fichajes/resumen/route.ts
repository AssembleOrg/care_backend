import { NextRequest } from 'next/server';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { horasEntre } from '@/src/domain/tiempo';

/**
 * Horas fichadas por un cuidador desde su última liquidación.
 * Alimenta el popup de la pantalla de liquidaciones: Dani ve el detalle y
 * decide si usa ese total o lo corrige a mano.
 */
async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);
  const cuidadorId = request.nextUrl.searchParams.get('cuidadorId');

  if (!cuidadorId) {
    return createErrorResponse('VALIDATION_ERROR', 'Falta el cuidadorId', undefined, requestId);
  }

  try {
    const ultimaLiquidacion = await prisma.pago.findFirst({
      where: { cuidadorId, metodo: 'LIQUIDACION' },
      orderBy: { semanaFin: 'desc' },
      select: { id: true, semanaFin: true, fecha: true, horasTrabajadas: true },
    });

    // Desde el día siguiente al último período liquidado; si nunca se liquidó,
    // desde el primer fichaje que exista.
    const desde = ultimaLiquidacion ? new Date(ultimaLiquidacion.semanaFin.getTime() + 1000) : undefined;

    const fichajes = await prisma.fichaje.findMany({
      where: {
        cuidadorId,
        salidaAt: { not: null },
        revision: { not: 'RECHAZADO' },
        ...(desde ? { entradaAt: { gte: desde } } : {}),
      },
      include: { persona: { select: { nombreCompleto: true } } },
      orderBy: { entradaAt: 'asc' },
    });

    const detalle = fichajes.map((f) => ({
      id: f.id,
      personaNombre: f.persona.nombreCompleto,
      entradaAt: f.entradaAt.toISOString(),
      salidaAt: f.salidaAt!.toISOString(),
      horas: horasEntre(f.entradaAt, f.salidaAt!),
      revision: f.revision,
      pendienteDeRevision: f.revision === 'PENDIENTE',
    }));

    const totalHoras = Math.round(detalle.reduce((acc, d) => acc + d.horas, 0) * 100) / 100;
    const horasPendientes =
      Math.round(detalle.filter((d) => d.pendienteDeRevision).reduce((acc, d) => acc + d.horas, 0) * 100) / 100;

    const turnosSinCerrar = await prisma.fichaje.count({ where: { cuidadorId, salidaAt: null } });

    return createSuccessResponse(
      {
        desde: (desde ?? fichajes[0]?.entradaAt ?? null)?.toISOString() ?? null,
        hasta: fichajes.length > 0 ? fichajes[fichajes.length - 1].salidaAt!.toISOString() : null,
        totalHoras,
        horasPendientes,
        turnosSinCerrar,
        ultimaLiquidacion: ultimaLiquidacion
          ? {
              fecha: ultimaLiquidacion.fecha.toISOString(),
              semanaFin: ultimaLiquidacion.semanaFin.toISOString(),
              horasTrabajadas: Number(ultimaLiquidacion.horasTrabajadas),
            }
          : null,
        detalle,
      },
      requestId
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al calcular las horas fichadas', message, requestId, 500);
  }
}

export const GET = requireAuth(handleGET);
