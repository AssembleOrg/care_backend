import { NextRequest } from 'next/server';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/src/presentation/middleware/responseWrapper';
import { prisma } from '@/src/infrastructure/database/PrismaService';

async function handlePOST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cuidadorId, precioPorHora, semanaInicio, semanaFin, horarios, monto } = body;

    if (!cuidadorId || !precioPorHora || !semanaInicio || !semanaFin || !horarios || !monto) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Faltan campos requeridos: cuidadorId, precioPorHora, semanaInicio, semanaFin, horarios, monto'
      );
    }

    // Verificar que el cuidador existe
    const cuidador = await prisma.cuidador.findUnique({
      where: { id: cuidadorId },
    });

    if (!cuidador) {
      return createErrorResponse('NOT_FOUND', 'Cuidador no encontrado');
    }

    // Crear el pago como liquidación
    const pago = await prisma.pago.create({
      data: {
        cuidadorId,
        monto: monto,
        fecha: new Date(semanaFin),
        metodo: 'LIQUIDACION',
        nota: `Liquidación semanal del ${new Date(semanaInicio).toLocaleDateString('es-AR')} al ${new Date(semanaFin).toLocaleDateString('es-AR')}. ${horarios.filter((h: { horas: number }) => h.horas > 0).length} días trabajados.`,
        esLiquidacion: true,
        precioPorHora: precioPorHora,
        horasTrabajadas: horarios.reduce((sum: number, h: { horas: number }) => sum + h.horas, 0),
        semanaInicio: new Date(semanaInicio),
        semanaFin: new Date(semanaFin),
        horarios: horarios,
      },
      include: {
        cuidador: true,
      },
    });

    return createSuccessResponse({
      id: pago.id,
      monto: Number(pago.monto),
      fecha: pago.fecha.toISOString(),
      horasTrabajadas: Number(pago.horasTrabajadas),
      precioPorHora: Number(pago.precioPorHora),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error creating liquidación:', message);
    return createErrorResponse('INTERNAL_ERROR', message);
  }
}

export const POST = requireAuth(handlePOST);
