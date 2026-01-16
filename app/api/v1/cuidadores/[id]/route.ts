import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth, HandlerContext } from '@/src/presentation/middleware/auth';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { plainToInstance } from 'class-transformer';
import { CuidadorDTO } from '@/src/application/dto/CuidadorDTO';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';
import { hashingService } from '@/src/infrastructure/crypto/HashingService';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';
import { z } from 'zod';

const cuidadorRepository = new CuidadorRepository();

const updateSchema = z.object({
  nombreCompleto: z.string().min(1).optional(),
  dni: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

async function handleGET(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };

  try {
    const cuidador = await cuidadorRepository.findById(params.id);
    if (!cuidador) {
      return createErrorResponse('NOT_FOUND', 'Cuidador no encontrado', undefined, requestId, 404);
    }

    const dto = plainToInstance(CuidadorDTO, cuidador, { excludeExtraneousValues: true });

    return createSuccessResponse(dto, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al obtener cuidador', message, requestId, 500);
  }
}

async function handlePUT(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();
    const validated = updateSchema.parse(body);

    const existing = await cuidadorRepository.findById(params.id);
    if (!existing) {
      return createErrorResponse('NOT_FOUND', 'Cuidador no encontrado', undefined, requestId, 404);
    }

    // Check for duplicates if DNI or email changed
    if (validated.dni !== undefined && validated.dni !== null) {
      const dniHash = hashingService.hash(validated.dni);
      const duplicate = await cuidadorRepository.findByDniHash(dniHash);
      if (duplicate && duplicate.id !== params.id) {
        return createErrorResponse('DUPLICATE_ERROR', 'Ya existe un cuidador con este DNI', undefined, requestId, 409);
      }
    }

    if (validated.email !== undefined && validated.email !== null) {
      const emailHash = hashingService.hash(validated.email);
      const duplicate = await cuidadorRepository.findByEmailHash(emailHash);
      if (duplicate && duplicate.id !== params.id) {
        return createErrorResponse('DUPLICATE_ERROR', 'Ya existe un cuidador con este email', undefined, requestId, 409);
      }
    }

    // Encrypt and hash updated fields
    const updateData: any = {};
    if (validated.nombreCompleto !== undefined) {
      updateData.nombreCompleto = validated.nombreCompleto;
    }
    if (validated.dni !== undefined) {
      updateData.dniEnc = validated.dni ? encryptionService.encrypt(validated.dni) : null;
      updateData.dniHash = validated.dni ? hashingService.hash(validated.dni) : null;
    }
    if (validated.telefono !== undefined) {
      updateData.telefonoEnc = validated.telefono ? encryptionService.encrypt(validated.telefono) : null;
      updateData.telefonoHash = validated.telefono ? hashingService.hash(validated.telefono) : null;
    }
    if (validated.email !== undefined) {
      updateData.emailEnc = validated.email ? encryptionService.encrypt(validated.email) : null;
      updateData.emailHash = validated.email ? hashingService.hash(validated.email) : null;
    }

    const updated = await cuidadorRepository.update(params.id, updateData);

    // Audit
    await auditService.log({
      actor: 'ADMIN',
      action: 'UPDATE',
      table: 'Cuidador',
      recordId: params.id,
      oldData: { nombreCompleto: existing.nombreCompleto },
      newData: { nombreCompleto: updated.nombreCompleto },
      ip,
      userAgent,
    });

    const dto = plainToInstance(CuidadorDTO, updated, { excludeExtraneousValues: true });

    return createSuccessResponse(dto, requestId);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Datos inválidos', error.issues, requestId, 400);
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al actualizar cuidador', message, requestId, 500);
  }
}

async function handleDELETE(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const cuidador = await cuidadorRepository.findById(params.id);
    if (!cuidador) {
      return createErrorResponse('NOT_FOUND', 'Cuidador no encontrado', undefined, requestId, 404);
    }

    await cuidadorRepository.delete(params.id);

    // Audit
    const { auditService } = await import('@/src/infrastructure/audit/AuditService');
    await auditService.log({
      actor: 'ADMIN',
      action: 'DELETE',
      table: 'Cuidador',
      recordId: params.id,
      oldData: { nombreCompleto: cuidador.nombreCompleto },
      ip,
      userAgent,
    });

    return createSuccessResponse({ message: 'Cuidador eliminado' }, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al eliminar cuidador', message, requestId, 500);
  }
}

export const GET = requireAuth(handleGET);
export const PUT = requireAuth(handlePUT);
export const DELETE = requireAuth(handleDELETE);
