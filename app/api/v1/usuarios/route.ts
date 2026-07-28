import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, HandlerContext } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { createAdminClient } from '@/src/infrastructure/supabase/admin';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';

const createSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().min(1).optional(),
  rol: z.enum(['ADMIN', 'EMPLEADO']).default('EMPLEADO'),
  /** Cuidador con el que se vincula el empleado (requerido para fichar). */
  cuidadorId: z.string().uuid().optional().nullable(),
});

async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: [{ rol: 'asc' }, { email: 'asc' }],
      include: { cuidador: { select: { id: true, nombreCompleto: true } } },
    });

    return createSuccessResponse(
      usuarios.map((u) => ({
        id: u.id,
        email: u.email,
        nombre: u.nombre,
        rol: u.rol,
        activo: u.activo,
        cuidadorId: u.cuidadorId,
        cuidadorNombre: u.cuidador?.nombreCompleto ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
      requestId
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al listar usuarios', message, requestId, 500);
  }
}

async function handlePOST(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  let authUserId: string | null = null;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse('VALIDATION_ERROR', 'Datos inválidos', parsed.error.issues, requestId);
    }
    const { email, password, nombre, rol, cuidadorId } = parsed.data;

    const yaExiste = await prisma.usuario.findUnique({ where: { email } });
    if (yaExiste) {
      return createErrorResponse('CONFLICT', 'Ya existe un usuario con ese email', undefined, requestId, 409);
    }

    if (cuidadorId) {
      const cuidador = await prisma.cuidador.findUnique({ where: { id: cuidadorId } });
      if (!cuidador) {
        return createErrorResponse('NOT_FOUND', 'Cuidador no encontrado', undefined, requestId, 404);
      }
      const ocupado = await prisma.usuario.findUnique({ where: { cuidadorId } });
      if (ocupado) {
        return createErrorResponse('CONFLICT', 'Ese cuidador ya tiene un usuario asignado', undefined, requestId, 409);
      }
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // no hay flujo de verificación por mail: lo da de alta el admin
      app_metadata: { rol },
      user_metadata: nombre ? { nombre } : undefined,
    });

    if (error || !data.user) {
      return createErrorResponse('INTERNAL_ERROR', error?.message || 'No se pudo crear el usuario en Supabase', undefined, requestId, 500);
    }
    authUserId = data.user.id;

    const usuario = await prisma.usuario.create({
      data: {
        id: data.user.id,
        email,
        nombre: nombre ?? null,
        rol,
        cuidadorId: cuidadorId ?? null,
        activo: true,
      },
    });

    await auditService.log({
      actor: context.auth.email,
      action: 'CREATE',
      table: 'Usuario',
      recordId: usuario.id,
      newData: { email, rol, cuidadorId: cuidadorId ?? null },
      ip,
      userAgent,
    });

    return createSuccessResponse(
      {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        activo: usuario.activo,
        cuidadorId: usuario.cuidadorId,
      },
      requestId
    );
  } catch (error: unknown) {
    // Si falló el insert local, no dejamos el usuario huérfano en Supabase Auth.
    if (authUserId) {
      try {
        await createAdminClient().auth.admin.deleteUser(authUserId);
      } catch (cleanupError) {
        console.error('No se pudo revertir el usuario de Supabase:', cleanupError);
      }
    }
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al crear usuario', message, requestId, 500);
  }
}

export const GET = requireAuth(handleGET);
export const POST = requireAuth(handlePOST);
