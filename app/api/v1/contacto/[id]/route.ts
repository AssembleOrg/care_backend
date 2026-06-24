import { NextRequest, NextResponse } from 'next/server';
import { MensajeContactoRepository } from '@/src/infrastructure/database/repositories/MensajeContactoRepository';
import { MensajeContactoDTO } from '@/src/application/dto/MensajeContactoDTO';
import { plainToInstance } from 'class-transformer';
import { requireAuth } from '@/src/presentation/middleware/auth';

const mensajeContactoRepository = new MensajeContactoRepository();

async function handlePATCH(req: NextRequest, context: any) {
    try {
        const { id } = await context.params;
        const body = await req.json();

        if (typeof body.leido !== 'boolean') {
            return NextResponse.json({ error: 'El campo "leido" debe ser booleano' }, { status: 400 });
        }

        const result = await mensajeContactoRepository.setLeido(id, body.leido);
        const dto = plainToInstance(MensajeContactoDTO, result, { excludeExtraneousValues: true });
        return NextResponse.json(dto);
    } catch (error: any) {
        console.error('Error actualizando mensaje de contacto:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export const PATCH = requireAuth(handlePATCH);
