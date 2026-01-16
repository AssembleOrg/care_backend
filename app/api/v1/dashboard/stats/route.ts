import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { PagoRepository } from '@/src/infrastructure/database/repositories/PagoRepository';
import { prisma } from '@/src/infrastructure/database/PrismaService';

const cuidadorRepository = new CuidadorRepository();
const pagoRepository = new PagoRepository();

async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    // Obtener total de cuidadores
    const totalCuidadores = await cuidadorRepository.count();

    // Obtener total de pagos
    const totalPagos = await pagoRepository.count();

    // Obtener saldo total del mes actual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const saldoMesActual = await prisma.pago.aggregate({
      where: {
        fecha: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      _sum: {
        monto: true,
      },
    });

    const saldoTotal = saldoMesActual._sum.monto ? Number(saldoMesActual._sum.monto) : 0;

    return createSuccessResponse(
      {
        totalCuidadores,
        totalPagos,
        saldoTotalMes: saldoTotal,
      },
      requestId
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in handleGET dashboard stats:', message);
    return createErrorResponse('INTERNAL_ERROR', 'Error al obtener estadísticas del dashboard', message, requestId, 500);
  }
}

export const GET = requireAuth(handleGET);
