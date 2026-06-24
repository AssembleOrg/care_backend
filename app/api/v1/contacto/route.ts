import { NextRequest, NextResponse } from 'next/server';
import { CreateMensajeContactoUseCase } from '@/src/application/use-cases/CreateMensajeContactoUseCase';
import { ListMensajesContactoUseCase } from '@/src/application/use-cases/ListMensajesContactoUseCase';
import { MensajeContactoRepository } from '@/src/infrastructure/database/repositories/MensajeContactoRepository';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { getClientIp } from '@/src/presentation/middleware/rateLimit';
import { checkFormRateLimit, isHoneypotTriggered } from '@/src/presentation/middleware/formAntiSpam';
import { RATE_LIMIT_FORM_MAX, RATE_LIMIT_FORM_WINDOW_MS } from '@/src/config/constants';

const mensajeContactoRepository = new MensajeContactoRepository();
const createMensajeContactoUseCase = new CreateMensajeContactoUseCase(mensajeContactoRepository);
const listMensajesContactoUseCase = new ListMensajesContactoUseCase(mensajeContactoRepository);

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Envío de notificación por email via Brevo. Best-effort: si no está
 * configurado o falla, NO interrumpe el guardado del mensaje.
 */
async function notifyByBrevo(data: { nombre: string; telefono?: string; email: string; mensaje: string }): Promise<void> {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL || senderEmail;

    if (!apiKey || !senderEmail || !recipientEmail) {
        console.warn('Brevo no configurado: el mensaje se guardó pero no se envió notificación por email.');
        return;
    }

    const htmlContent = `
        <h2>Nueva consulta desde la web</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(data.nombre)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(data.telefono || '') || '-'}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(data.mensaje).replace(/\n/g, '<br/>')}</p>
    `;

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
                accept: 'application/json',
            },
            body: JSON.stringify({
                sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME || 'Care By Dani Web' },
                to: [{ email: recipientEmail }],
                replyTo: { email: data.email, name: data.nombre },
                subject: `Nueva consulta web de ${data.nombre}`,
                htmlContent,
            }),
        });

        if (!response.ok) {
            const detail = await response.text();
            console.error('Error de Brevo (no bloqueante):', response.status, detail);
        }
    } catch (error) {
        console.error('Excepción al enviar email por Brevo (no bloqueante):', error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Honeypot: campo trampa lleno = bot. Fingimos éxito.
        if (isHoneypotTriggered(body.website)) {
            return NextResponse.json({ message: 'Mensaje enviado correctamente.' }, { status: 201 });
        }

        // Rate limit por IP (anti-spam, respaldado en DB)
        const ip = getClientIp(req);
        const rate = await checkFormRateLimit(ip, 'contacto', RATE_LIMIT_FORM_MAX, RATE_LIMIT_FORM_WINDOW_MS);
        if (!rate.allowed) {
            return NextResponse.json(
                { error: 'Demasiados envíos. Esperá un rato e intentá de nuevo.' },
                { status: 429 },
            );
        }

        // 1. Persistir SIEMPRE (no depende de Brevo)
        const mensaje = await createMensajeContactoUseCase.execute(body);

        // 2. Notificar por email (best-effort, no rompe si falla/no está configurado)
        await notifyByBrevo({
            nombre: body.nombre,
            telefono: body.telefono,
            email: body.email,
            mensaje: body.mensaje,
        });

        return NextResponse.json({ message: 'Mensaje enviado correctamente.', id: mensaje.id }, { status: 201 });
    } catch (error: any) {
        console.error('Error guardando mensaje de contacto:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 400 }
        );
    }
}

async function handleGET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const search = url.searchParams.get('search') || undefined;

        const result = await listMensajesContactoUseCase.execute(page, limit, search);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error listando mensajes de contacto:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = requireAuth(handleGET);
