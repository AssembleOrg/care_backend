import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * El middleware corre en el edge runtime: no hay Prisma acá. Para rutear usa
 * el claim `rol` que se guarda en `app_metadata` al crear/editar el usuario.
 * La autorización real la hace la API contra la tabla `Usuario`.
 */
function getRol(appMetadata: Record<string, unknown> | undefined): 'ADMIN' | 'EMPLEADO' {
  return appMetadata?.rol === 'ADMIN' ? 'ADMIN' : 'EMPLEADO';
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith('/admin');
  const isEmpleadoArea = pathname.startsWith('/empleado');

  if (!isAdminArea && !isEmpleadoArea) return supabaseResponse;

  // getClaims verifica la firma del JWT en el proceso (el proyecto usa ES256):
  // ~1 ms contra los ~250 ms que costaba preguntarle a Supabase en CADA
  // navegación. Sólo si el token venció se llama a getUser, que lo renueva y
  // reescribe las cookies. La autorización real la hace igual la API.
  const { data: claims } = await supabase.auth.getClaims();
  let sesion: { id: string; rol: 'ADMIN' | 'EMPLEADO' } | null = claims?.claims?.sub
    ? { id: claims.claims.sub, rol: getRol(claims.claims.app_metadata as Record<string, unknown> | undefined) }
    : null;

  if (!sesion) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    sesion = user ? { id: user.id, rol: getRol(user.app_metadata) } : null;
  }

  if (!sesion) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const rol = sesion.rol;

  // Cada rol se queda en su área.
  if (isAdminArea && rol !== 'ADMIN') {
    const url = request.nextUrl.clone();
    url.pathname = '/empleado';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (isEmpleadoArea && rol === 'ADMIN') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
