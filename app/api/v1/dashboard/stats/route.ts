import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { PagoRepository } from '@/src/infrastructure/database/repositories/PagoRepository';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import dayjs from 'dayjs';

const cuidadorRepository = new CuidadorRepository();
const pagoRepository = new PagoRepository();

interface ActivityItem {
  id: string;
  type: 'person_add' | 'payment' | 'warning' | 'assignment';
  title: string;
  description: string;
  time: string;
  createdAt: string;
}

async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Mes anterior para comparar tendencias
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Todas estas consultas son independientes entre sí: en serie pagaban una
    // ida y vuelta a la base cada una (~200 ms desde acá) y el dashboard
    // tardaba más de dos segundos en abrir.
    const [
      totalCuidadores,
      totalCuidadoresLastMonth,
      liquidacionesRealizadas,
      saldoMesActual,
      saldoMesAnterior,
      auditLogs,
    ] = await Promise.all([
      cuidadorRepository.count(),
      prisma.cuidador.count({
        where: {
          createdAt: {
            lte: lastDayOfLastMonth,
          },
        },
      }),
      pagoRepository.count(),
      prisma.pago.aggregate({
        where: {
          fecha: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
        _sum: {
          monto: true,
        },
      }),
      prisma.pago.aggregate({
        where: {
          fecha: {
            gte: firstDayOfLastMonth,
            lte: lastDayOfLastMonth,
          },
        },
        _sum: {
          monto: true,
        },
      }),
      prisma.auditLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Calcular tendencia de cuidadores
    const cuidadoresTrend = totalCuidadoresLastMonth > 0
      ? ((totalCuidadores - totalCuidadoresLastMonth) / totalCuidadoresLastMonth) * 100
      : 0;

    // Todos los pagos son liquidaciones, así que es el mismo número.
    const totalPagos = liquidacionesRealizadas;

    const saldoTotal = saldoMesActual._sum.monto ? Number(saldoMesActual._sum.monto) : 0;
    const saldoAnterior = saldoMesAnterior._sum.monto ? Number(saldoMesAnterior._sum.monto) : 0;

    // Calcular tendencia de saldo
    const saldoTrend = saldoAnterior > 0
      ? ((saldoTotal - saldoAnterior) / saldoAnterior) * 100
      : 0;

    // Los datos relacionados se traen por lote. Antes cada uno de los 20 logs
    // disparaba entre una y tres consultas sueltas: cuarenta idas y vueltas a
    // la base para armar una lista de actividad reciente.
    const idsPorTabla = (tabla: string) =>
      auditLogs.filter((log) => log.table === tabla).map((log) => log.recordId);

    const [pagos, asignaciones] = await Promise.all([
      prisma.pago.findMany({
        where: { id: { in: idsPorTabla('Pago') } },
        select: { id: true, monto: true, cuidadorId: true },
      }),
      prisma.asignacion.findMany({
        where: { id: { in: idsPorTabla('Asignacion') } },
        select: { id: true, personaId: true, cuidadores: { select: { cuidadorId: true } } },
      }),
    ]);

    // Recién con pagos y asignaciones en mano se sabe qué cuidadores y personas
    // hacen falta, así que este segundo lote va después.
    const cuidadoresIds = new Set<string>([
      ...idsPorTabla('Cuidador'),
      ...pagos.map((p) => p.cuidadorId).filter(Boolean),
      ...asignaciones.flatMap((a) => a.cuidadores.map((c) => c.cuidadorId)),
    ]);
    const personasIds = new Set<string>(asignaciones.map((a) => a.personaId).filter(Boolean));

    const [cuidadores, personas] = await Promise.all([
      prisma.cuidador.findMany({
        where: { id: { in: Array.from(cuidadoresIds) } },
        select: { id: true, nombreCompleto: true },
      }),
      prisma.personaAsistida.findMany({
        where: { id: { in: Array.from(personasIds) } },
        select: { id: true, nombreCompleto: true },
      }),
    ]);

    const porId = <T extends { id: string }>(lista: T[]) => new Map(lista.map((x) => [x.id, x]));
    const mapaCuidadores = porId(cuidadores);
    const mapaPersonas = porId(personas);
    const mapaPagos = porId(pagos);
    const mapaAsignaciones = porId(asignaciones);

    const actividadesConDatos = auditLogs.map((log) => {
      let cuidador: { nombreCompleto: string } | null = null;
      let pago: { monto: unknown; cuidadorId: string } | null = null;
      let persona: { nombreCompleto: string } | null = null;
      const asignacion = log.table === 'Asignacion' ? (mapaAsignaciones.get(log.recordId) ?? null) : null;

      if (log.table === 'Cuidador') {
        cuidador = mapaCuidadores.get(log.recordId) ?? null;
      } else if (log.table === 'Pago') {
        pago = mapaPagos.get(log.recordId) ?? null;
        if (pago?.cuidadorId) cuidador = mapaCuidadores.get(pago.cuidadorId) ?? null;
      } else if (asignacion) {
        const primerCuidador = asignacion.cuidadores[0]?.cuidadorId;
        if (primerCuidador) cuidador = mapaCuidadores.get(primerCuidador) ?? null;
        if (asignacion.personaId) persona = mapaPersonas.get(asignacion.personaId) ?? null;
      }

      return {
        ...log,
        cuidador,
        pago,
        asignacion: asignacion
          ? {
              ...asignacion,
              cuidadoresIds: asignacion.cuidadores.map((c) => c.cuidadorId),
              cuidador,
              persona,
            }
          : null,
      };
    });

    const activities: ActivityItem[] = actividadesConDatos.map((log) => {
      const timeAgo = dayjs(log.createdAt);
      const now = dayjs();
      const diffMinutes = now.diff(timeAgo, 'minute');
      const diffHours = now.diff(timeAgo, 'hour');
      const diffDays = now.diff(timeAgo, 'day');

      let timeString = '';
      if (diffMinutes < 60) {
        timeString = `Hace ${diffMinutes}m`;
      } else if (diffHours < 24) {
        timeString = `Hace ${diffHours}h`;
      } else {
        timeString = `Hace ${diffDays}d`;
      }

      // Determinar tipo y contenido según la acción y tabla
      if (log.table === 'Cuidador' && log.action === 'CREATE') {
        const nombreCompleto = log.cuidador?.nombreCompleto || 
                               (log.newData as { nombreCompleto?: string })?.nombreCompleto || 
                               'Un cuidador';
        return {
          id: log.id,
          type: 'person_add' as const,
          title: 'Nuevo cuidador registrado',
          description: `${nombreCompleto} se unió a la plataforma`,
          time: timeString,
          createdAt: log.createdAt.toISOString(),
        };
      } else if (log.table === 'Pago' && log.action === 'CREATE') {
        const cuidadorNombre = log.cuidador?.nombreCompleto || 'Un cuidador';
        const monto = log.pago?.monto ? Number(log.pago.monto) : 
                     ((log.newData as { monto?: number })?.monto || 0);
        return {
          id: log.id,
          type: 'payment' as const,
          title: 'Pago procesado exitosamente',
          description: `Liquidación de ${cuidadorNombre} - $${monto.toLocaleString('es-AR')}`,
          time: timeString,
          createdAt: log.createdAt.toISOString(),
        };
      } else if (log.table === 'Asignacion' && log.action === 'CREATE') {
        const cuidadorNombre = log.asignacion?.cuidador?.nombreCompleto || 'Un cuidador';
        const personaNombre = log.asignacion?.persona?.nombreCompleto || 'una persona';
        return {
          id: log.id,
          type: 'assignment' as const,
          title: 'Nueva asignación creada',
          description: `${cuidadorNombre} asignado a ${personaNombre}`,
          time: timeString,
          createdAt: log.createdAt.toISOString(),
        };
      } else {
        // Actividad genérica
        return {
          id: log.id,
          type: 'warning' as const,
          title: `${log.action} en ${log.table}`,
          description: `Acción realizada en el sistema`,
          time: timeString,
          createdAt: log.createdAt.toISOString(),
        };
      }
    });

    // Calcular porcentajes de progreso (basados en objetivos o promedios)
    // Para cuidadores: usar un objetivo de 200 (75% = 150/200)
    const cuidadoresProgress = Math.min((totalCuidadores / 200) * 100, 100);
    
    // Para liquidaciones realizadas: usar un objetivo de 100 (50% = 50/100)
    const liquidacionesProgress = Math.min((liquidacionesRealizadas / 100) * 100, 100);
    
    // Para saldo: usar un objetivo de 50000 (50% = 25000/50000)
    const saldoProgress = Math.min((saldoTotal / 50000) * 100, 100);

    return createSuccessResponse(
      {
        totalCuidadores,
        totalPagos,
        saldoTotalMes: saldoTotal,
        liquidacionesRealizadas,
        actividades: activities,
        tendencias: {
          cuidadores: {
            porcentaje: cuidadoresTrend,
            valor: totalCuidadores - totalCuidadoresLastMonth,
          },
          saldo: {
            porcentaje: saldoTrend,
            valor: saldoTotal - saldoAnterior,
          },
        },
        progreso: {
          cuidadores: cuidadoresProgress,
          pagos: liquidacionesProgress,
          saldo: saldoProgress,
        },
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
