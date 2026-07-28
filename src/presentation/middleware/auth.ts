import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { RolUsuario } from '@prisma/client';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { createErrorResponse } from './responseWrapper';

export interface AuthContext {
  userId: string;
  email: string;
  rol: RolUsuario;
  /** Cuidador vinculado al usuario. Sólo los EMPLEADO deberían tenerlo. */
  cuidadorId: string | null;
}

interface AuthFailure {
  code: 'UNAUTHORIZED' | 'FORBIDDEN';
  message: string;
  status: number;
}

type AuthResult = { ok: true; auth: AuthContext } | { ok: false; error: AuthFailure };

const UNAUTHORIZED: AuthFailure = { code: 'UNAUTHORIZED', message: 'No autorizado', status: 401 };

/**
 * Valida la sesión de Supabase y resuelve el rol contra la tabla `Usuario`,
 * que es la fuente de verdad: el claim `rol` del JWT sólo se usa para el
 * ruteo en el middleware de Next, nunca para autorizar en la API.
 *
 * Un usuario de Supabase Auth sin fila en `Usuario` no tiene acceso a nada.
 */
export async function resolveAuth(request: NextRequest): Promise<AuthResult> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase env variables not configured');
      return { ok: false, error: UNAUTHORIZED };
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No need to set cookies in verification
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Auth error:', error.message);
      return { ok: false, error: UNAUTHORIZED };
    }

    if (!user) {
      return { ok: false, error: UNAUTHORIZED };
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { rol: true, activo: true, cuidadorId: true, email: true },
    });

    if (!usuario) {
      return {
        ok: false,
        error: { code: 'FORBIDDEN', message: 'Usuario sin permisos asignados', status: 403 },
      };
    }

    if (!usuario.activo) {
      return {
        ok: false,
        error: { code: 'FORBIDDEN', message: 'Usuario bloqueado', status: 403 },
      };
    }

    return {
      ok: true,
      auth: {
        userId: user.id,
        email: user.email || usuario.email,
        rol: usuario.rol,
        cuidadorId: usuario.cuidadorId,
      },
    };
  } catch (error: unknown) {
    console.error('Error in resolveAuth:', error);
    return { ok: false, error: UNAUTHORIZED };
  }
}

/** @deprecated Usar `resolveAuth`: no distingue "sin sesión" de "sin permiso". */
export async function verifyAuth(request: NextRequest): Promise<AuthContext | null> {
  const result = await resolveAuth(request);
  return result.ok ? result.auth : null;
}

export interface HandlerContext {
  params?: { [key: string]: string };
  auth: AuthContext;
}

type Handler = (req: NextRequest, context: HandlerContext) => Promise<NextResponse>;

/** Envuelve un handler exigiendo sesión activa y uno de los roles indicados. */
export function requireRole(roles: RolUsuario[], handler: Handler) {
  return async (req: NextRequest, context: { params?: { [key: string]: string } | Promise<{ [key: string]: string }> }) => {
    const result = await resolveAuth(req);
    if (!result.ok) {
      return createErrorResponse(result.error.code, result.error.message, undefined, undefined, result.error.status);
    }
    if (!roles.includes(result.auth.rol)) {
      return createErrorResponse('FORBIDDEN', 'No tenés permisos para esta acción', undefined, undefined, 403);
    }
    // Resolver params si es una Promise (Next.js 16)
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    return handler(req, { ...context, params: resolvedParams, auth: result.auth });
  };
}

/**
 * Rutas del panel de administración. Histórico: todo lo que ya estaba
 * envuelto en `requireAuth` es del panel de Dani, así que exige ADMIN.
 */
export function requireAuth(handler: Handler) {
  return requireRole(['ADMIN'], handler);
}

/** Rutas del portal del empleado (fichaje). */
export function requireEmpleado(handler: Handler) {
  return requireRole(['EMPLEADO'], handler);
}
