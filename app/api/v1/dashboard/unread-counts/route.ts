import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/infrastructure/database/PrismaService';
import { EstadoSolicitud } from '@/src/domain/entities/EstadoSolicitud';
import { requireAuth } from '@/src/presentation/middleware/auth';

async function handleGET(_req: NextRequest) {
    try {
        const [contacto, solicitudes] = await Promise.all([
            prisma.mensajeContacto.count({ where: { leido: false } }),
            prisma.solicitudEmpleo.count({ where: { estado: { not: EstadoSolicitud.CERRADA } } }),
        ]);
        return NextResponse.json({ contacto, solicitudes });
    } catch (error: any) {
        console.error('Error obteniendo unread counts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = requireAuth(handleGET);
