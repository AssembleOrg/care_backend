import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { PersonaAsistidaRepository } from '@/src/infrastructure/database/repositories/PersonaAsistidaRepository';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';
import { hashingService } from '@/src/infrastructure/crypto/HashingService';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { PersonaAsistidaDTO } from '@/src/application/dto/PersonaAsistidaDTO';
import { plainToInstance } from 'class-transformer';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';
import { PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from '@/src/config/constants';
import { z } from 'zod';

const personaRepository = new PersonaAsistidaRepository();

const createSchema = z.object({
  nombreCompleto: z.string().min(1),
  dni: z.string().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  telefonoContactoEmergencia: z.string().optional(),
});

async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);
  const searchParams = request.nextUrl.searchParams;
  const all = searchParams.get('all') === 'true';
  const search = searchParams.get('search') || undefined;

  try {
    if (all) {
      // Cuando se usa all=true, devolver array simple con búsqueda opcional
      const personas = await personaRepository.findAll(undefined, undefined, search);
      const dtos = personas.map(p => plainToInstance(PersonaAsistidaDTO, p, { excludeExtraneousValues: true }));
      return createSuccessResponse(dtos, requestId);
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || String(PAGINATION_DEFAULT_PAGE), 10));
    const limit = Math.min(PAGINATION_MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(PAGINATION_DEFAULT_LIMIT), 10)));

    const [personas, total] = await Promise.all([
      personaRepository.findAll((page - 1) * limit, limit, search),
      personaRepository.count(search),
    ]);

    const dtos = personas.map(p => plainToInstance(PersonaAsistidaDTO, p, { excludeExtraneousValues: true }));

    return createSuccessResponse({
      data: dtos,
      total,
      page,
      limit,
    }, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in handleGET personas-asistidas:', message);
    return createErrorResponse('INTERNAL_ERROR', 'Error al listar personas asistidas', message, requestId, 500);
  }
}

async function handlePOST(request: NextRequest) {
  const requestId = getRequestId(request);
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json();
    const validated = createSchema.parse(body);

    // Encrypt and hash
    const dniEnc = validated.dni ? encryptionService.encrypt(validated.dni) : null;
    const dniHash = validated.dni ? hashingService.hash(validated.dni) : null;
    const telefonoEnc = validated.telefono ? encryptionService.encrypt(validated.telefono) : null;
    const telefonoHash = validated.telefono ? hashingService.hash(validated.telefono) : null;
    const direccionEnc = validated.direccion ? encryptionService.encrypt(validated.direccion) : null;
    const direccionHash = validated.direccion ? hashingService.hash(validated.direccion) : null;
    const telefonoContactoEmergenciaEnc = validated.telefonoContactoEmergencia ? encryptionService.encrypt(validated.telefonoContactoEmergencia) : null;
    const telefonoContactoEmergenciaHash = validated.telefonoContactoEmergencia ? hashingService.hash(validated.telefonoContactoEmergencia) : null;

    const persona = await personaRepository.create({
      nombreCompleto: validated.nombreCompleto,
      dniEnc,
      dniHash,
      telefonoEnc,
      telefonoHash,
      direccionEnc,
      direccionHash,
      telefonoContactoEmergenciaEnc,
      telefonoContactoEmergenciaHash,
    });

    // Audit
    await auditService.log({
      actor: 'ADMIN',
      action: 'CREATE',
      table: 'PersonaAsistida',
      recordId: persona.id,
      newData: { nombreCompleto: validated.nombreCompleto },
      ip,
      userAgent,
    });

    const dto = plainToInstance(PersonaAsistidaDTO, {
      ...persona,
      dni: validated.dni || null,
      telefono: validated.telefono || null,
      direccion: validated.direccion || null,
      telefonoContactoEmergencia: validated.telefonoContactoEmergencia || null,
    }, { excludeExtraneousValues: true });

    return createSuccessResponse(dto, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    if (message.includes('Ya existe')) {
      return createErrorResponse('DUPLICATE_ERROR', message, undefined, requestId, 409);
    }
    return createErrorResponse('VALIDATION_ERROR', message || 'Error al crear persona asistida', undefined, requestId, 400);
  }
}

export const GET = requireAuth(handleGET);
export const POST = requireAuth(handlePOST);
