import { NextRequest, NextResponse } from 'next/server';
import { SolicitudEmpleoRepository } from '@/src/infrastructure/database/repositories/SolicitudEmpleoRepository';
import { UpdateSolicitudEmpleoUseCase } from '@/src/application/use-cases/UpdateSolicitudEmpleoUseCase';
import { EstadoSolicitud } from '@/src/domain/entities/EstadoSolicitud';
import { requireAuth } from '@/src/presentation/middleware/auth';

// Instanciar dependencias
const solicitudEmpleoRepository = new SolicitudEmpleoRepository();
const updateSolicitudEmpleoUseCase = new UpdateSolicitudEmpleoUseCase(solicitudEmpleoRepository);

async function handlePATCH(req: NextRequest, context: any) {
    try {
        const { id } = await context.params;

        const body = await req.json();
        if (!body.estado || !Object.values(EstadoSolicitud).includes(body.estado)) {
            return NextResponse.json({ error: 'Estado inválido o faltante' }, { status: 400 });
        }

        const auditContext = {
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
        };

        const result = await updateSolicitudEmpleoUseCase.execute(id, body.estado, auditContext);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error updating solicitud estado:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export const PATCH = requireAuth(handlePATCH);
