import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { prisma } from '@/src/infrastructure/database/PrismaService';

async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    // Contar total de logs
    const totalLogs = await prisma.auditLog.count();
    
    // Obtener los últimos 10 logs
    const logs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        actor: true,
        action: true,
        table: true,
        recordId: true,
        createdAt: true,
        newData: true,
      },
    });

    // Agrupar por tabla
    const byTable = await prisma.auditLog.groupBy({
      by: ['table'],
      _count: {
        id: true,
      },
    });

    // Agrupar por acción
    const byAction = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        id: true,
      },
    });

    // Verificar cuidadores sin logs
    const cuidadores = await prisma.cuidador.findMany({
      select: {
        id: true,
        nombreCompleto: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const cuidadoresConLogs = await Promise.all(
      cuidadores.map(async (cuidador) => {
        const log = await prisma.auditLog.findFirst({
          where: {
            table: 'Cuidador',
            recordId: cuidador.id,
            action: 'CREATE',
          },
        });

        return {
          ...cuidador,
          tieneLog: !!log,
          logId: log?.id || null,
        };
      })
    );

    return createSuccessResponse(
      {
        totalLogs,
        ultimosLogs: logs,
        porTabla: byTable,
        porAccion: byAction,
        cuidadoresVerificados: cuidadoresConLogs,
      },
      requestId
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in handleGET dashboard debug:', message);
    return createErrorResponse('INTERNAL_ERROR', 'Error al obtener información de debug', message, requestId, 500);
  }
}

// Temporalmente sin auth para debug
export async function GET(request: NextRequest) {
  return handleGET(request);
}
