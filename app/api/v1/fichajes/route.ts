import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireEmpleado, HandlerContext } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { hashingService } from '@/src/infrastructure/crypto/HashingService';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';
import { chequearRango } from '@/src/domain/geo';
import { horasEntre } from '@/src/domain/tiempo';

const marcaSchema = z.object({
  personaId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  /** `accuracy` que informa el navegador, en metros. */
  precision: z.number().nonnegative().optional().nullable(),
});

/** Listado para el panel de Dani. */
async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);
  const sp = request.nextUrl.searchParams;
  const cuidadorId = sp.get('cuidadorId') || undefined;
  const personaId = sp.get('personaId') || undefined;
  const revision = sp.get('revision') || undefined;
  const desde = sp.get('desde');
  const hasta = sp.get('hasta');

  try {
    const fichajes = await prisma.fichaje.findMany({
      where: {
        ...(cuidadorId ? { cuidadorId } : {}),
        ...(personaId ? { personaId } : {}),
        ...(revision ? { revision: revision as never } : {}),
        ...(desde || hasta
          ? {
              entradaAt: {
                ...(desde ? { gte: new Date(desde) } : {}),
                ...(hasta ? { lte: new Date(hasta) } : {}),
              },
            }
          : {}),
      },
      include: {
        cuidador: { select: { nombreCompleto: true } },
        persona: { select: { nombreCompleto: true } },
      },
      orderBy: { entradaAt: 'desc' },
      take: 500,
    });

    return createSuccessResponse(
      fichajes.map((f) => ({
        id: f.id,
        cuidadorId: f.cuidadorId,
        cuidadorNombre: f.cuidador.nombreCompleto,
        personaId: f.personaId,
        personaNombre: f.persona.nombreCompleto,
        entradaAt: f.entradaAt.toISOString(),
        entradaDistanciaM: Math.round(f.entradaDistanciaM),
        entradaEnRango: f.entradaEnRango,
        entradaLat: f.entradaLat,
        entradaLng: f.entradaLng,
        salidaAt: f.salidaAt?.toISOString() ?? null,
        salidaDistanciaM: f.salidaDistanciaM != null ? Math.round(f.salidaDistanciaM) : null,
        salidaEnRango: f.salidaEnRango,
        horas: f.salidaAt ? horasEntre(f.entradaAt, f.salidaAt) : null,
        revision: f.revision,
        notaRevision: f.notaRevision,
      })),
      requestId
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al listar fichajes', message, requestId, 500);
  }
}

/** Marca de entrada del empleado. */
async function handlePOST(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const { cuidadorId, userId } = context.auth;

  if (!cuidadorId) {
    return createErrorResponse(
      'SIN_CUIDADOR',
      'Tu usuario todavía no está vinculado a un cuidador. Pedile a la administración que lo asigne.',
      undefined,
      requestId,
      409
    );
  }

  try {
    const body = await request.json();
    const parsed = marcaSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Datos de ubicación inválidos', parsed.error.issues, requestId);
    }
    const { personaId, lat, lng, precision } = parsed.data;

    const abierto = await prisma.fichaje.findFirst({ where: { cuidadorId, salidaAt: null } });
    if (abierto) {
      return createErrorResponse('TURNO_ABIERTO', 'Ya tenés un turno abierto: marcá la salida antes de otra entrada', undefined, requestId, 409);
    }

    const persona = await prisma.personaAsistida.findUnique({ where: { id: personaId } });
    if (!persona) {
      return createErrorResponse('NOT_FOUND', 'Persona no encontrada', undefined, requestId, 404);
    }

    // El empleado sólo puede fichar en personas que tiene asignadas.
    const ahora = new Date();
    const [asignacion, vinculo] = await Promise.all([
      prisma.asignacion.findFirst({
        where: {
          personaId,
          cuidadores: { some: { cuidadorId } },
          fechaInicio: { lte: ahora },
          OR: [{ fechaFin: null }, { fechaFin: { gte: ahora } }],
        },
        select: { id: true },
      }),
      prisma.personaCuidador.findFirst({ where: { personaId, cuidadorId, activo: true }, select: { id: true } }),
    ]);

    if (!asignacion && !vinculo) {
      return createErrorResponse('FORBIDDEN', 'No tenés asignada a esa persona', undefined, requestId, 403);
    }

    if (persona.lat == null || persona.lng == null) {
      return createErrorResponse(
        'SIN_UBICACION',
        'El domicilio de esa persona todavía no tiene ubicación cargada. Avisale a la administración.',
        undefined,
        requestId,
        409
      );
    }

    const { distanciaMetros, enRango } = chequearRango(
      { lat: persona.lat, lng: persona.lng },
      { lat, lng },
      persona.radioMetros,
      precision
    );

    const fichaje = await prisma.fichaje.create({
      data: {
        usuarioId: userId,
        cuidadorId,
        personaId,
        asignacionId: asignacion?.id ?? null,
        entradaAt: ahora,
        entradaLat: lat,
        entradaLng: lng,
        entradaPrecisionM: precision ?? null,
        entradaDistanciaM: distanciaMetros,
        entradaEnRango: enRango,
        // Fuera de radio no bloquea: queda registrado y Dani decide.
        revision: enRango ? 'NO_REQUIERE' : 'PENDIENTE',
        userAgent: request.headers.get('user-agent') || undefined,
        ipHash: hashingService.hash(getClientIp(request) || 'desconocida'),
      },
    });

    return createSuccessResponse(
      {
        id: fichaje.id,
        entradaAt: fichaje.entradaAt.toISOString(),
        distanciaMetros: Math.round(distanciaMetros),
        enRango,
        radioMetros: persona.radioMetros,
      },
      requestId
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al registrar la entrada', message, requestId, 500);
  }
}

export const GET = requireAuth(handleGET);
export const POST = requireEmpleado(handlePOST);
