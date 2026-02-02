import { z } from 'zod';
import { ContratoRepository } from '@/src/infrastructure/database/repositories/ContratoRepository';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';
import { hashingService } from '@/src/infrastructure/crypto/HashingService';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { ContratoDTO } from '../dto/ContratoDTO';
import { plainToInstance } from 'class-transformer';

const createSchema = z.object({
    idCliente: z.string().optional().nullable(),

    nombreManual: z.string().optional().nullable(),
    cuitManual: z.string().optional().nullable(),
    direccionManual: z.string().optional().nullable(),
    telefonoEmergencia: z.string().optional().nullable(),

    fechaInicio: z.coerce.date(),
    fechaFin: z.coerce.date(),
}).refine(data => {
    // Si NO hay idCliente, los datos manuales son obligatorios
    if (!data.idCliente) {
        // Deben estar presentes nombre, cuit y direccion (telefono es opcional)
        return !!(data.nombreManual && data.cuitManual && data.direccionManual);
    }
    return true;
}, {
    message: "Si no selecciona un cliente existente, debe completar Nombre, CUIT y Dirección manualmente.",
    path: ["root"]
});

export class CreateContratoUseCase {
    constructor(private repository: ContratoRepository) { }

    async execute(data: z.infer<typeof createSchema>, auditContext: { ip?: string; userAgent?: string }): Promise<ContratoDTO> {
        const validated = createSchema.parse(data);

        // Se asume que no hay dato manual
        let nombreManualHash = null;
        let cuitManualHash = null;
        let direccionManualHash = null;
        let telefonoEmergenciaHash = null;

        // Si hay datos manuales, se hashean
        if (validated.nombreManual) nombreManualHash = hashingService.hash(validated.nombreManual);
        if (validated.cuitManual) cuitManualHash = hashingService.hash(validated.cuitManual);
        if (validated.direccionManual) direccionManualHash = hashingService.hash(validated.direccionManual);
        if (validated.telefonoEmergencia) telefonoEmergenciaHash = hashingService.hash(validated.telefonoEmergencia);

        // Si hay datos manuales, se encriptan
        const nombreManualEnc = validated.nombreManual ? encryptionService.encrypt(validated.nombreManual) : null;
        const cuitManualEnc = validated.cuitManual ? encryptionService.encrypt(validated.cuitManual) : null;
        const direccionManualEnc = validated.direccionManual ? encryptionService.encrypt(validated.direccionManual) : null;
        const telefonoEmergenciaEnc = validated.telefonoEmergencia ? encryptionService.encrypt(validated.telefonoEmergencia) : null;

        // Se crea el contrato
        const contrato = await this.repository.create({
            idCliente: validated.idCliente ?? null,
            nombreManual: nombreManualEnc,
            nombreManualHash,
            cuitManual: cuitManualEnc,
            cuitManualHash,
            direccionManual: direccionManualEnc,
            direccionManualHash,
            telefonoEmergencia: telefonoEmergenciaEnc,
            telefonoEmergenciaHash,
            fechaInicio: validated.fechaInicio,
            fechaFin: validated.fechaFin,
        });

        await auditService.log({
            actor: 'ADMIN',
            action: 'CREATE',
            table: 'Contrato',
            recordId: contrato.id,
            newData: {
                fechaInicio: validated.fechaInicio,
                idCliente: validated.idCliente,
                nombreManual: validated.nombreManual ? '***' : null
            },
            ip: auditContext.ip,
            userAgent: auditContext.userAgent,
        });

        return plainToInstance(ContratoDTO, contrato, { excludeExtraneousValues: true });
    }
}