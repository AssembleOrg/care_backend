import { NextRequest } from 'next/server';
import { requireEmpleado, HandlerContext } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';
import { diaSemanaLocal, horasEntre } from '@/src/domain/tiempo';
import type { Horario } from '@/src/application/services/HorarioValidationService';

function desencriptar(valor: string | null): string | null {
  if (!valor) return null;
  try {
    return encryptionService.decrypt(valor);
  } catch {
    return null;
  }
}

function horariosDeHoy(horarios: unknown, dia: number): Horario[] {
  if (!Array.isArray(horarios)) return [];
  return (horarios as Horario[]).filter((h) => h && typeof h === 'object' && h.diaSemana === dia);
}

/** Lo que el empleado necesita para fichar: a quién cuida hoy y si tiene un turno abierto. */
async function handleGET(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const { cuidadorId } = context.auth;

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
    const ahora = new Date();
    const dia = diaSemanaLocal(ahora);

    const [asignaciones, vinculos, turnoAbierto, ultimos] = await Promise.all([
      prisma.asignacion.findMany({
        where: {
          cuidadores: { some: { cuidadorId } },
          fechaInicio: { lte: ahora },
          OR: [{ fechaFin: null }, { fechaFin: { gte: ahora } }],
        },
        include: { persona: true },
      }),
      prisma.personaCuidador.findMany({
        where: { cuidadorId, activo: true },
        include: { persona: true },
      }),
      prisma.fichaje.findFirst({
        where: { cuidadorId, salidaAt: null },
        include: {
          // lat/lng van también acá: el mapa de confirmación de la salida los
          // necesita sin tener que buscar la persona en el listado.
          persona: { select: { id: true, nombreCompleto: true, lat: true, lng: true, radioMetros: true } },
        },
        orderBy: { entradaAt: 'desc' },
      }),
      prisma.fichaje.findMany({
        where: { cuidadorId, salidaAt: { not: null } },
        include: { persona: { select: { nombreCompleto: true } } },
        orderBy: { entradaAt: 'desc' },
        take: 10,
      }),
    ]);

    // Una persona puede llegar por asignación o por vínculo directo: se unifica.
    const personas = new Map<
      string,
      {
        id: string;
        nombreCompleto: string;
        direccion: string | null;
        lat: number | null;
        lng: number | null;
        radioMetros: number;
        asignacionId: string | null;
        horariosHoy: Horario[];
      }
    >();

    for (const v of vinculos) {
      personas.set(v.persona.id, {
        id: v.persona.id,
        nombreCompleto: v.persona.nombreCompleto,
        direccion: desencriptar(v.persona.direccionEnc),
        lat: v.persona.lat,
        lng: v.persona.lng,
        radioMetros: v.persona.radioMetros,
        asignacionId: null,
        horariosHoy: [],
      });
    }

    for (const a of asignaciones) {
      const previo = personas.get(a.persona.id);
      personas.set(a.persona.id, {
        id: a.persona.id,
        nombreCompleto: a.persona.nombreCompleto,
        direccion: desencriptar(a.persona.direccionEnc),
        lat: a.persona.lat,
        lng: a.persona.lng,
        radioMetros: a.persona.radioMetros,
        asignacionId: a.id,
        horariosHoy: [...(previo?.horariosHoy ?? []), ...horariosDeHoy(a.horarios, dia)],
      });
    }

    return createSuccessResponse(
      {
        personas: Array.from(personas.values()).sort((a, b) => {
          // Primero las que tienen horario hoy.
          if (a.horariosHoy.length !== b.horariosHoy.length) return b.horariosHoy.length - a.horariosHoy.length;
          return a.nombreCompleto.localeCompare(b.nombreCompleto);
        }),
        turnoAbierto: turnoAbierto
          ? {
              id: turnoAbierto.id,
              personaId: turnoAbierto.personaId,
              personaNombre: turnoAbierto.persona.nombreCompleto,
              lat: turnoAbierto.persona.lat,
              lng: turnoAbierto.persona.lng,
              radioMetros: turnoAbierto.persona.radioMetros,
              entradaAt: turnoAbierto.entradaAt.toISOString(),
              entradaDistanciaM: Math.round(turnoAbierto.entradaDistanciaM),
              entradaEnRango: turnoAbierto.entradaEnRango,
            }
          : null,
        ultimos: ultimos.map((f) => ({
          id: f.id,
          personaNombre: f.persona.nombreCompleto,
          entradaAt: f.entradaAt.toISOString(),
          salidaAt: f.salidaAt!.toISOString(),
          horas: horasEntre(f.entradaAt, f.salidaAt!),
          revision: f.revision,
        })),
      },
      requestId
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al cargar tu jornada', message, requestId, 500);
  }
}

export const GET = requireEmpleado(handleGET);
