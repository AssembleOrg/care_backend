import { type NextRequest } from 'next/server';
import { updateSession } from '@/src/infrastructure/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Only run the auth/session middleware on protected admin routes.
     * Public pages and static assets skip the Supabase getUser() network
     * call, which was previously executed on every single request.
     */
    '/admin/:path*',
  ],
};
