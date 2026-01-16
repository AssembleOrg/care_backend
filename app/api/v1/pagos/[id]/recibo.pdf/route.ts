import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HandlerContext } from '@/src/presentation/middleware/auth';
import { createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';
import { PagoRepository } from '@/src/infrastructure/database/repositories/PagoRepository';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { PersonaAsistidaRepository } from '@/src/infrastructure/database/repositories/PersonaAsistidaRepository';
import { pdfService } from '@/src/application/services/PDFService';

const pagoRepository = new PagoRepository();
const cuidadorRepository = new CuidadorRepository();
const personaRepository = new PersonaAsistidaRepository();

async function handleGET(request: NextRequest, context: HandlerContext) {
  const requestId = getRequestId(request);
  const params = context.params as { id: string };

  try {
    const pago = await pagoRepository.findById(params.id);
    if (!pago) {
      return createErrorResponse('NOT_FOUND', 'Pago no encontrado', undefined, requestId, 404);
    }

    const cuidador = await cuidadorRepository.findById(pago.cuidadorId);
    if (!cuidador) {
      return createErrorResponse('NOT_FOUND', 'Cuidador no encontrado', undefined, requestId, 404);
    }

    const persona = pago.personaId ? await personaRepository.findById(pago.personaId) : undefined;

    const buffer = await pdfService.generateRecibo({ pago, cuidador, persona: persona || undefined });

    // Convertir Buffer a Uint8Array para NextResponse
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recibo-${params.id}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse('INTERNAL_ERROR', 'Error al generar recibo', message, requestId, 500);
  }
}

export const GET = requireAuth(handleGET);
