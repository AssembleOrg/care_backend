import { NextRequest, NextResponse } from 'next/server';
import { CreateSolicitudUseCase } from '@/src/application/use-cases/CreateSolicitudUseCase';
import { SolicitudEmpleoRepository } from '@/src/infrastructure/database/repositories/SolicitudEmpleoRepository';
import { ListSolicitudesEmpleoUseCase } from '@/src/application/use-cases/ListSolicitudesEmpleoUseCase';
import { EstadoSolicitud } from '@/src/domain/entities/EstadoSolicitud';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { createAdminClient } from '@/src/infrastructure/supabase/admin';

// Instanciar dependencias
const solicitudEmpleoRepository = new SolicitudEmpleoRepository();
const createSolicitudUseCase = new CreateSolicitudUseCase(solicitudEmpleoRepository);
const listSolicitudesEmpleoUseCase = new ListSolicitudesEmpleoUseCase(solicitudEmpleoRepository);

const CV_BUCKET = process.env.SUPABASE_CV_BUCKET || 'cvs';
const MAX_CV_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_CV_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function sanitizeFileName(name: string): string {
    // Separar nombre y extensión para no romper esta última
    const lastDot = name.lastIndexOf('.');
    const hasExt = lastDot > 0 && lastDot < name.length - 1;
    const base = hasExt ? name.slice(0, lastDot) : name;
    const ext = hasExt ? name.slice(lastDot + 1) : '';

    const normalize = (s: string) =>
        s
            .normalize('NFD')                       // descompone acentos (á -> a + combinante)
            .replace(/[\u0300-\u036f]/g, '')        // elimina los diacríticos (incluye ñ -> n)
            .replace(/[^a-zA-Z0-9._-]/g, '_')       // resto de caracteres no soportados
            .replace(/_+/g, '_')                    // colapsa múltiples _
            .replace(/^[._-]+|[._-]+$/g, '');       // limpia bordes

    const safeBase = normalize(base) || 'cv';
    const safeExt = normalize(ext);

    return (safeExt ? `${safeBase}.${safeExt}` : safeBase).slice(-100);
}

async function uploadCv(file: File): Promise<string> {
    if (file.size > MAX_CV_BYTES) {
        throw new Error('El CV no puede superar los 10MB.');
    }
    if (file.type && !ALLOWED_CV_TYPES.includes(file.type)) {
        throw new Error('Formato de CV inválido. Se aceptan PDF, DOC o DOCX.');
    }

    const supabase = createAdminClient();
    const path = `solicitudes/${crypto.randomUUID()}-${sanitizeFileName(file.name || 'cv')}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage.from(CV_BUCKET).upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
    });

    if (error) {
        console.error('Error subiendo CV a Storage:', error);
        throw new Error('No se pudo subir el CV. Intentá nuevamente.');
    }
    return path;
}

async function handleGET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const search = url.searchParams.get('search') || undefined;
        const estado = url.searchParams.get('estado') as EstadoSolicitud || undefined;

        const result = await listSolicitudesEmpleoUseCase.execute(page, limit, search, estado);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error listing solicitudes:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let body: Record<string, any>;

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            body = {
                nombre: formData.get('nombre') ?? undefined,
                apellido: formData.get('apellido') ?? undefined,
                zonaTrabajo: formData.get('zonaTrabajo') ?? undefined,
                telefono: formData.get('telefono') ?? undefined,
                email: formData.get('email') ?? undefined,
                experiencia: (formData.get('experiencia') as string) || undefined,
            };

            const cv = formData.get('cv');
            if (cv && cv instanceof File && cv.size > 0) {
                body.cvUrl = await uploadCv(cv);
            }
        } else {
            body = await req.json();
        }

        const auditContext = {
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
        };

        const solicitudEmpleo = await createSolicitudUseCase.execute(body as any, auditContext);

        return NextResponse.json(solicitudEmpleo, { status: 201 });
    } catch (error: any) {
        console.error('Error creating solicitud:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 400 }
        );
    }

}

export const GET = requireAuth(handleGET);
