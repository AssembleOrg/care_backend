import { NextRequest, NextResponse } from 'next/server';
import { CreateSolicitudUseCase } from '@/src/application/use-cases/CreateSolicitudUseCase';
import { SolicitudEmpleoRepository } from '@/src/infrastructure/database/repositories/SolicitudEmpleoRepository';
import { ListSolicitudesEmpleoUseCase } from '@/src/application/use-cases/ListSolicitudesEmpleoUseCase';
import { EstadoSolicitud } from '@/src/domain/entities/EstadoSolicitud';
import { requireAuth } from '@/src/presentation/middleware/auth';

// Instanciar dependencias
const solicitudEmpleoRepository = new SolicitudEmpleoRepository();
const createSolicitudUseCase = new CreateSolicitudUseCase(solicitudEmpleoRepository);
const listSolicitudesEmpleoUseCase = new ListSolicitudesEmpleoUseCase(solicitudEmpleoRepository);

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
        const body = await req.json();

        const auditContext = {
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
        };

        const solicitudEmpleo = await createSolicitudUseCase.execute(body, auditContext);

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
