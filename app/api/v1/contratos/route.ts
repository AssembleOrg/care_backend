import { NextRequest, NextResponse } from 'next/server';
import { CreateContratoUseCase } from '@/src/application/use-cases/CreateContratoUseCase';
import { ContratoRepository } from '@/src/infrastructure/database/repositories/ContratoRepository';
import { ContratoDTO } from '@/src/application/dto/ContratoDTO';
import { plainToInstance } from 'class-transformer';

// Instanciar dependencias
const contratoRepository = new ContratoRepository();
const createContratoUseCase = new CreateContratoUseCase(contratoRepository);

export async function GET(req: NextRequest) {
    try {
        const take = 20; //Unicamente toma los ultimos 20 contratos
        const skip = 0;
        // Para obtener "los últimos", el repositorio ya ordena por fecha desc.
        const contratos = await contratoRepository.findAll(skip, take);
        const dtos = contratos.map(c => plainToInstance(ContratoDTO, c, { excludeExtraneousValues: true }));

        return NextResponse.json(dtos);
    } catch (error: any) {
        console.error('Error listing contratos:', error);
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

        const contrato = await createContratoUseCase.execute(body, auditContext);

        return NextResponse.json(contrato, { status: 201 });
    } catch (error: any) {
        console.error('Error creating contrato:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 400 }
        );
    }
}
