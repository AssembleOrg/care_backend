import { NextRequest } from 'next/server';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { PagoRepository } from '@/src/infrastructure/database/repositories/PagoRepository';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { PagoDTO } from '@/src/application/dto/PagoDTO';
import { plainToInstance } from 'class-transformer';

const pagoRepository = new PagoRepository();
const cuidadorRepository = new CuidadorRepository();

async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);
  const searchParams = request.nextUrl.searchParams;
  const all = searchParams.get('all') === 'true';
  const asignacionId = searchParams.get('asignacionId');
  const cuidadorId = searchParams.get('cuidadorId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    // Obtener cuidadores para incluir nombres
    const cuidadoresData = await cuidadorRepository.findAll();
    const cuidadoresMap = new Map(cuidadoresData.map(c => [c.id, c.nombreCompleto]));

    // Filtrar por asignacionId si se proporciona
    if (asignacionId && all) {
      const pagos = await pagoRepository.findByAsignacionId(asignacionId);
      const dtos = pagos.map(p => ({
        ...plainToInstance(PagoDTO, p, { excludeExtraneousValues: true }),
        cuidadorNombre: cuidadoresMap.get(p.cuidadorId) || '',
      }));
      return createSuccessResponse(dtos, requestId);
    }

    // Filtrar por cuidador si se proporciona
    if (cuidadorId) {
      const fromDate = from ? new Date(from) : undefined;
      const toDate = to ? new Date(to) : undefined;
      const pagos = await pagoRepository.findByCuidadorId(cuidadorId, fromDate, toDate);
      const dtos = pagos.map(p => ({
        ...plainToInstance(PagoDTO, p, { excludeExtraneousValues: true }),
        cuidadorNombre: cuidadoresMap.get(p.cuidadorId) || '',
      }));
      return createSuccessResponse(dtos, requestId);
    }

    // Si se solicita 'all', devolver todos
    if (all) {
      const pagos = await pagoRepository.findAll();
      const dtos = pagos.map(p => ({
        ...plainToInstance(PagoDTO, p, { excludeExtraneousValues: true }),
        cuidadorNombre: cuidadoresMap.get(p.cuidadorId) || '',
      }));
      return createSuccessResponse(dtos, requestId);
    }

    // Por defecto, devolver lista vacía o implementar paginación si es necesario
    return createSuccessResponse([], requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in handleGET liquidaciones:', message);
    return createErrorResponse('INTERNAL_ERROR', 'Error al listar liquidaciones', message, requestId, 500);
  }
}

async function handlePOST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cuidadorId, precioPorHora, fechaInicio, fechaFin, horasTrabajadas, monto, asignacionId } = body;

    if (!cuidadorId || !precioPorHora || !fechaInicio || !fechaFin || !horasTrabajadas || !monto) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Faltan campos requeridos: cuidadorId, precioPorHora, fechaInicio, fechaFin, horasTrabajadas, monto'
      );
    }

    // Validar que las fechas sean válidas
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);

    if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
      return createErrorResponse('VALIDATION_ERROR', 'Fechas inválidas');
    }

    if (fechaInicioDate > fechaFinDate) {
      return createErrorResponse('VALIDATION_ERROR', 'La fecha de inicio debe ser anterior a la fecha de fin');
    }

    // Validar horas trabajadas
    if (horasTrabajadas <= 0) {
      return createErrorResponse('VALIDATION_ERROR', 'Las horas trabajadas deben ser mayores a 0');
    }

    // Verificar que el cuidador existe
    const cuidador = await prisma.cuidador.findUnique({
      where: { id: cuidadorId },
    });

    if (!cuidador) {
      return createErrorResponse('NOT_FOUND', 'Cuidador no encontrado');
    }

    // Calcular monto (por si acaso no coincide)
    const montoCalculado = horasTrabajadas * precioPorHora;

    // Validar asignacionId si se proporciona
    if (asignacionId) {
      const asignacion = await prisma.asignacion.findUnique({
        where: { id: asignacionId },
      });
      if (!asignacion) {
        return createErrorResponse('NOT_FOUND', 'Asignación no encontrada');
      }
    }

    // Obtener personaId de la asignación si existe
    let personaId: string | undefined;
    if (asignacionId) {
      const asignacion = await prisma.asignacion.findUnique({
        where: { id: asignacionId },
        select: { personaId: true },
      });
      personaId = asignacion?.personaId;
    }

    // Crear el pago como liquidación
    const pago = await prisma.pago.create({
      data: {
        cuidadorId,
        personaId: personaId || null,
        asignacionId: asignacionId || null,
        monto: montoCalculado,
        fecha: fechaFinDate,
        metodo: 'LIQUIDACION',
        nota: `Liquidación del ${fechaInicioDate.toLocaleDateString('es-AR')} al ${fechaFinDate.toLocaleDateString('es-AR')}. ${horasTrabajadas} horas trabajadas.`,
        precioPorHora: precioPorHora,
        horasTrabajadas: horasTrabajadas,
        semanaInicio: fechaInicioDate,
        semanaFin: fechaFinDate,
        horarios: [] as unknown as any, // Ya no usamos horarios detallados
      } as any, // Cast temporal para evitar problemas de tipos
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

export const GET = requireAuth(handleGET);
export const POST = requireAuth(handlePOST);
