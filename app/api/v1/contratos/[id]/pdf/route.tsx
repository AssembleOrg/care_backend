import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { ContratoRepository } from '@/src/infrastructure/database/repositories/ContratoRepository';
import { PersonaAsistidaRepository } from '@/src/infrastructure/database/repositories/PersonaAsistidaRepository';
import { ContratoPDF } from '@/src/presentation/components/contratos/ContratoPDF';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';


// Instanciar dependencias
const contratoRepository = new ContratoRepository();
const personaRepository = new PersonaAsistidaRepository();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const contrato = await contratoRepository.findById(id);

        if (!contrato) {
            return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
        }

        let pdfData;

        if (contrato.idCliente) {
            const persona = await personaRepository.findById(contrato.idCliente);
            let nombre = persona?.nombreCompleto || 'Desconocido';
            let cuit = '';
            let direccion = '';

            if (persona) {
                if (persona.dniEnc) {
                    try { cuit = encryptionService.decrypt(persona.dniEnc); } catch { }
                }
                if (persona.direccionEnc) {
                    try { direccion = encryptionService.decrypt(persona.direccionEnc); } catch { }
                }
            }

            pdfData = {
                nombre,
                cuit,
                direccion,
                fechaInicio: contrato.fechaInicio.toISOString(),
                fechaFin: contrato.fechaFin ? contrato.fechaFin.toISOString() : '',
                telefonoEmergencia: '',
            };

        } else {
            // Manual
            pdfData = {
                nombre: contrato.nombreManual ? encryptionService.decrypt(contrato.nombreManual) : '',
                cuit: contrato.cuitManual ? encryptionService.decrypt(contrato.cuitManual) : '',
                direccion: contrato.direccionManual ? encryptionService.decrypt(contrato.direccionManual) : '',
                fechaInicio: contrato.fechaInicio.toISOString(),
                fechaFin: contrato.fechaFin ? contrato.fechaFin.toISOString() : '',
                telefonoEmergencia: contrato.telefonoEmergencia ? encryptionService.decrypt(contrato.telefonoEmergencia) : '',
            };
        }

        const stream = await renderToStream(<ContratoPDF {...pdfData} />);

        return new NextResponse(stream as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="contrato_${id}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error('Error generating PDF:', error);
        return NextResponse.json({ error: 'Error generando PDF: ' + error.message }, { status: 500 });
    }
}
