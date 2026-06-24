import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

/**
 * Cliente de Supabase con service-role key. Solo para uso en el servidor.
 * Permite subir archivos a Storage saltando RLS.
 */
export function createAdminClient(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error('Supabase admin no configurado: falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    }

    if (!adminClient) {
        adminClient = createClient(url, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
    }
    return adminClient;
}
