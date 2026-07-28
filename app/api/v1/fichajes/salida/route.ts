import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireEmpleado, HandlerContext } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { chequearRango } from '@/src/domain/geo';
import { horasEntre } from '@/src/domain/tiempo';

const schema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  precision: z.number().nonnegative().optional().nullable(),
});

/** Cierra el turno abierto del empleado. */
async function handlePOST(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const { cuidadorId } = context.auth;

  if (!cuidadorId) {
    return createErrorResponse('SIN_CUIDADOR', 'Tu usuario no está vinculado a un cuidador', undefined, requestId, 409);
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Datos de ubicación inválidos', parsed.error.issues, requestId);
    }
    const { lat, lng, precision } = parsed.data;

    const abierto = await prisma.fichaje.findFirst({
      where: { cuidadorId, salidaAt: null },
      orderBy: { entradaAt: 'desc' },
      include: { persona: { select: { lat: true, lng: true, radioMetros: true } } },
    });

    if (!abierto) {
      return createErrorResponse('SIN_TURNO', 'No tenés ningún turno abierto', undefined, requestId, 409);
    }

    const destino =
      abierto.persona.lat != null && abierto.persona.lng != null
        ? { lat: abierto.persona.lat, lng: abierto.persona.lng }
        : null;

    const chequeo = destino
      ? chequearRango(destino, { lat, lng }, abierto.persona.radioMetros, precision)
      : { distanciaMetros: 0, enRango: true };

    const salidaAt = new Date();
    const actualizado = await prisma.fichaje.update({
      where: { id: abierto.id },
      data: {
        salidaAt,
        salidaLat: lat,
        salidaLng: lng,
        salidaPrecisionM: precision ?? null,
        salidaDistanciaM: chequeo.distanciaMetros,
        salidaEnRango: chequeo.enRango,
        // Con el turno cerrado se recalcula si hace falta que Dani lo revise.
        revision: abierto.entradaEnRango && chequeo.enRango ? 'NO_REQUIERE' : 'PENDIENTE',
      },
    });

    return createSuccessResponse(
      {
        id: actualizado.id,
        entradaAt: actualizado.entradaAt.toISOString(),
        salidaAt: salidaAt.toISOString(),
        horas: horasEntre(actualizado.entradaAt, salidaAt),
        distanciaMetros: Math.round(chequeo.distanciaMetros),
        enRango: chequeo.enRango,
      },
      requestId
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al registrar la salida', message, requestId, 500);
  }
}

export const POST = requireEmpleado(handlePOST);
