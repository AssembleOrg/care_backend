import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createErrorResponse } from './responseWrapper';

export interface AuthContext {
  userId: string;
  email: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthContext | null> {
  try {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase env variables not configured');
      return null;
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
      return null;
    }

    if (!user) {
      return null;
    }

    return { userId: user.id, email: user.email || '' };
  } catch (error: unknown) {
    console.error('Error in verifyAuth:', error);
    return null;
  }
}

export interface HandlerContext {
  params?: { [key: string]: string };
  auth: AuthContext;
}

export function requireAuth(handler: (req: NextRequest, context: HandlerContext) => Promise<NextResponse>) {
  return async (req: NextRequest, context: { params?: { [key: string]: string } | Promise<{ [key: string]: string }> }) => {
    const auth = await verifyAuth(req);
    if (!auth) {
      return createErrorResponse('UNAUTHORIZED', 'No autorizado', undefined, undefined, 401);
    }
    // Resolver params si es una Promise (Next.js 16)
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    return handler(req, { ...context, params: resolvedParams, auth });
  };
}
