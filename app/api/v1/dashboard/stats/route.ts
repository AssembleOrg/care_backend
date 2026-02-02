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

    // Obtener total de cuidadores
    const totalCuidadores = await cuidadorRepository.count();
    const totalCuidadoresLastMonth = await prisma.cuidador.count({
      where: {
        createdAt: {
          lte: lastDayOfLastMonth,
        },
      },
    });

    // Calcular tendencia de cuidadores
    const cuidadoresTrend = totalCuidadoresLastMonth > 0
      ? ((totalCuidadores - totalCuidadoresLastMonth) / totalCuidadoresLastMonth) * 100
      : 0;

    // Obtener liquidaciones realizadas (todos los pagos, ya que todos son liquidaciones)
    const liquidacionesRealizadas = await pagoRepository.count();

    // Obtener total de pagos
    const totalPagos = await pagoRepository.count();

    // Obtener saldo total del mes actual
    const [saldoMesActual, saldoMesAnterior] = await Promise.all([
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
    ]);

    const saldoTotal = saldoMesActual._sum.monto ? Number(saldoMesActual._sum.monto) : 0;
    const saldoAnterior = saldoMesAnterior._sum.monto ? Number(saldoMesAnterior._sum.monto) : 0;

    // Calcular tendencia de saldo
    const saldoTrend = saldoAnterior > 0
      ? ((saldoTotal - saldoAnterior) / saldoAnterior) * 100
      : 0;

    // Obtener actividades recientes (últimas 20) desde AuditLog
    const auditLogs = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    // Obtener datos relacionados manualmente para evitar problemas con relaciones
    const actividadesConDatos = await Promise.all(
      auditLogs.map(async (log) => {
        let cuidador = null;
        let pago = null;
        let asignacion = null;
        let persona = null;
        let contrato = null;

        if (log.table === 'Cuidador') {
          cuidador = await prisma.cuidador.findUnique({
            where: { id: log.recordId },
            select: { nombreCompleto: true },
          });
        } else if (log.table === 'Pago') {
          pago = await prisma.pago.findUnique({
            where: { id: log.recordId },
            select: {
              monto: true,
              cuidadorId: true,
            },
          });
          if (pago?.cuidadorId) {
            cuidador = await prisma.cuidador.findUnique({
              where: { id: pago.cuidadorId },
              select: { nombreCompleto: true },
            });
          }
        } else if (log.table === 'Asignacion') {
          asignacion = await prisma.asignacion.findUnique({
            where: { id: log.recordId },
            select: {
              cuidadorId: true,
              personaId: true,
            },
          });
          if (asignacion?.cuidadorId) {
            cuidador = await prisma.cuidador.findUnique({
              where: { id: asignacion.cuidadorId },
              select: { nombreCompleto: true },
            });
          }
          if (asignacion?.personaId) {
            persona = await prisma.personaAsistida.findUnique({
              where: { id: asignacion.personaId },
              select: { nombreCompleto: true },
            });
          }
        } else if (log.table === 'Contrato') {
          contrato = await prisma.contrato.findUnique({
            where: { id: log.recordId },
            include: { persona: { select: { nombreCompleto: true } } },
          });
        }

        return {
          ...log,
          cuidador,
          pago,
          asignacion: asignacion ? { ...asignacion, cuidador, persona } : null,
          contrato,
        };
      })
    );

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
      } else if (log.table === 'Contrato' && log.action === 'CREATE') {
        // @ts-ignore - log.contrato is added in the map above but typescript might not know it without full typing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contratoObj = (log as any).contrato;
        const personaNombre = contratoObj?.persona?.nombreCompleto ||
          (log.newData as { nombreManual?: string })?.nombreManual ||
          'Cliente';
        return {
          id: log.id,
          type: 'assignment' as const, // Usamos assignment icon para contratos también
          title: 'Contrato Creado',
          description: `Contrato generado para ${personaNombre}`,
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

    // Para liquidaciones hechas: usar un objetivo de 20 (25% = 5/20)
    // Reemplazamos pagosPendientes por liquidacionesRealizadas
    const liquidacionesProgress = Math.min((liquidacionesRealizadas / 20) * 100, 100);

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
