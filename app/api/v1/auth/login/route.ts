import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { checkRateLimit, getClientIp } from '@/src/presentation/middleware/rateLimit';
import { RATE_LIMIT_LOGIN_ATTEMPTS, RATE_LIMIT_LOGIN_WINDOW_MS } from '@/src/config/constants';

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const ip = getClientIp(request);

  // Rate limiting
  const rateLimit = checkRateLimit(request, RATE_LIMIT_LOGIN_ATTEMPTS, RATE_LIMIT_LOGIN_WINDOW_MS);
  if (!rateLimit.allowed) {
    return createErrorResponse(
      'RATE_LIMIT_EXCEEDED',
      'Demasiados intentos. Intenta nuevamente más tarde.',
      { resetAt: rateLimit.resetAt },
      requestId,
      429,
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return createErrorResponse('VALIDATION_ERROR', 'Email y contraseña son requeridos', undefined, requestId, 400);
    }

    let response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return createErrorResponse('INVALID_CREDENTIALS', error.message, undefined, requestId, 401);
    }

    // Create success response with cookies
    const successResponse = createSuccessResponse(
      { userId: data.user.id, email: data.user.email },
      requestId,
    );

    // Copy cookies from supabase response
    response.cookies.getAll().forEach(cookie => {
      successResponse.cookies.set(cookie.name, cookie.value);
    });

    return successResponse;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error interno del servidor', message, requestId, 500);
  }
}
