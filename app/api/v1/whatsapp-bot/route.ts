import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/src/presentation/middleware/auth';

/**
 * Proxy autenticado hacia el servidor de control del bot de WhatsApp
 * (proyecto care-whatsapp-bot, deployado aparte en Railway).
 *
 * El secret nunca llega al browser: vive solo en el server (WHATSAPP_BOT_SECRET).
 *   GET  -> estado del bot { connected, loggedIn, qr }
 *   POST -> { action: 'restart' | 'logout' }
 */

const BOT_URL = process.env.WHATSAPP_BOT_URL; // ej: https://care-whatsapp-bot.up.railway.app
const BOT_SECRET = process.env.WHATSAPP_BOT_SECRET;

function ensureConfigured(): string | null {
    if (!BOT_URL || !BOT_SECRET) {
        return 'El bot de WhatsApp no está configurado (faltan WHATSAPP_BOT_URL / WHATSAPP_BOT_SECRET).';
    }
    return null;
}

async function handleGET(_req: NextRequest) {
    const configError = ensureConfigured();
    if (configError) {
        return NextResponse.json({ error: configError }, { status: 503 });
    }

    try {
        const res = await fetch(`${BOT_URL}/status`, {
            headers: { 'X-Bot-Secret': BOT_SECRET! },
            cache: 'no-store',
            signal: AbortSignal.timeout(8000),
        });
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch {
        return NextResponse.json(
            { error: 'No se pudo contactar al bot. ¿Está corriendo el servicio?', connected: false, loggedIn: false, qr: null },
            { status: 502 },
        );
    }
}

async function handlePOST(req: NextRequest) {
    const configError = ensureConfigured();
    if (configError) {
        return NextResponse.json({ error: configError }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    if (action !== 'restart' && action !== 'logout') {
        return NextResponse.json({ error: 'Acción inválida. Usá restart o logout.' }, { status: 400 });
    }

    try {
        const res = await fetch(`${BOT_URL}/${action}`, {
            method: 'POST',
            headers: { 'X-Bot-Secret': BOT_SECRET! },
            signal: AbortSignal.timeout(8000),
        });
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status });
    } catch {
        // El bot sale del proceso al reiniciar/cerrar sesión: un corte de conexión acá es esperable.
        return NextResponse.json({ ok: true, action, note: 'El bot se está reiniciando.' });
    }
}

export const GET = requireAuth(handleGET);
export const POST = requireAuth(handlePOST);
