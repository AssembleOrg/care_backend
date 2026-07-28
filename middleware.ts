import { type NextRequest } from 'next/server';
import { updateSession } from '@/src/infrastructure/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Only run the auth/session middleware on protected areas (admin panel
     * and employee portal). Public pages and static assets skip the Supabase
     * getUser() network call, which was previously executed on every request.
     */
    '/admin/:path*',
    '/cuidador/:path*',
  ],
};
