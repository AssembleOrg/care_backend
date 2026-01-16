import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth, HandlerContext } from '@/src/presentation/middleware/auth';
import { PersonaAsistidaRepository } from '@/src/infrastructure/database/repositories/PersonaAsistidaRepository';
import { plainToInstance } from 'class-transformer';
import { PersonaAsistidaDTO } from '@/src/application/dto/PersonaAsistidaDTO';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';
import { hashingService } from '@/src/infrastructure/crypto/HashingService';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';
import { z } from 'zod';

const personaRepository = new PersonaAsistidaRepository();

const updateSchema = z.object({
  nombreCompleto: z.string().min(1).optional(),
  dni: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  telefonoContactoEmergencia: z.string().optional().nullable(),
});

async function handleGET(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };

  try {
    const persona = await personaRepository.findById(params.id);
    if (!persona) {
      return createErrorResponse('NOT_FOUND', 'Persona asistida no encontrada', undefined, requestId, 404);
    }

    const dto = plainToInstance(PersonaAsistidaDTO, persona, { excludeExtraneousValues: true });

    return createSuccessResponse(dto, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al obtener persona asistida', message, requestId, 500);
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

    const existing = await personaRepository.findById(params.id);
    if (!existing) {
      return createErrorResponse('NOT_FOUND', 'Persona asistida no encontrada', undefined, requestId, 404);
    }

    // Encrypt and hash updated fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    if (validated.direccion !== undefined) {
      updateData.direccionEnc = validated.direccion ? encryptionService.encrypt(validated.direccion) : null;
      updateData.direccionHash = validated.direccion ? hashingService.hash(validated.direccion) : null;
    }
    if (validated.telefonoContactoEmergencia !== undefined) {
      updateData.telefonoContactoEmergenciaEnc = validated.telefonoContactoEmergencia ? encryptionService.encrypt(validated.telefonoContactoEmergencia) : null;
      updateData.telefonoContactoEmergenciaHash = validated.telefonoContactoEmergencia ? hashingService.hash(validated.telefonoContactoEmergencia) : null;
    }

    const updated = await personaRepository.update(params.id, updateData);

    // Audit
    await auditService.log({
      actor: 'ADMIN',
      action: 'UPDATE',
      table: 'PersonaAsistida',
      recordId: params.id,
      oldData: { nombreCompleto: existing.nombreCompleto },
      newData: { nombreCompleto: updated.nombreCompleto },
      ip,
      userAgent,
    });

    const dto = plainToInstance(PersonaAsistidaDTO, updated, { excludeExtraneousValues: true });

    return createSuccessResponse(dto, requestId);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('VALIDATION_ERROR', 'Datos inválidos', error.issues, requestId, 400);
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al actualizar persona asistida', message, requestId, 500);
  }
}

async function handleDELETE(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const persona = await personaRepository.findById(params.id);
    if (!persona) {
      return createErrorResponse('NOT_FOUND', 'Persona asistida no encontrada', undefined, requestId, 404);
    }

    await personaRepository.delete(params.id);

    // Audit
    await auditService.log({
      actor: 'ADMIN',
      action: 'DELETE',
      table: 'PersonaAsistida',
      recordId: params.id,
      oldData: { nombreCompleto: persona.nombreCompleto },
      ip,
      userAgent,
    });

    return createSuccessResponse({ message: 'Persona asistida eliminada' }, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al eliminar persona asistida', message, requestId, 500);
  }
}

export const GET = requireAuth(handleGET);
export const PUT = requireAuth(handlePUT);
export const DELETE = requireAuth(handleDELETE);
