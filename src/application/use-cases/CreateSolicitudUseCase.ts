import { z } from 'zod';
import { SolicitudEmpleoRepository } from '@/src/infrastructure/database/repositories/SolicitudEmpleoRepository';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';
import { hashingService } from '@/src/infrastructure/crypto/HashingService';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { SolicitudEmpleoDTO } from '../dto/SolicitudEmpleoDTO';
import { plainToInstance } from 'class-transformer';
import { EstadoSolicitud } from '@/src/domain/entities/EstadoSolicitud';

const createSolicitudSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    apellido: z.string().min(1, 'El apellido es requerido'),
    zonaTrabajo: z.string().min(1, 'La zona de trabajo es requerida'),
    telefono: z.string().min(1, 'El telefono es requerido'),
    email: z.email('El email debe ser un correo electrónico válido'),
    experiencia: z.string().max(200, 'La experiencia debe tener como máximo 200 caracteres').optional(),
});

export class CreateSolicitudUseCase {
    constructor(private readonly solicitudEmpleoRepository: SolicitudEmpleoRepository) { }

    async execute(data: z.infer<typeof createSolicitudSchema>, auditContext: { ip?: string; userAgent?: string }): Promise<SolicitudEmpleoDTO> {
        const validatedData = createSolicitudSchema.parse(data);

        const telefonoHash = hashingService.hash(validatedData.telefono);
        const emailHash = hashingService.hash(validatedData.email);

        const telefonoEnc = encryptionService.encrypt(validatedData.telefono);
        const emailEnc = encryptionService.encrypt(validatedData.email);

        const experienciaEnc = validatedData.experiencia ? encryptionService.encrypt(validatedData.experiencia) : null;
        const experienciaHash = validatedData.experiencia ? hashingService.hash(validatedData.experiencia) : null;

        const solicitudEmpleo = await this.solicitudEmpleoRepository.create({
            nombre: validatedData.nombre,
            apellido: validatedData.apellido,
            zonaTrabajo: validatedData.zonaTrabajo,
            telefono: telefonoEnc,
            telefonoHash: telefonoHash,
            email: emailEnc,
            emailHash: emailHash,
            estado: EstadoSolicitud.ABIERTA,
            experiencia: experienciaEnc,
            experienciaHash: experienciaHash,
        });

        await auditService.log({
            actor: 'ADMIN',
            action: 'CREATE',
            table: 'Solicitud_Empleo',
            recordId: solicitudEmpleo.id,
            newData: {
                nombre: solicitudEmpleo.nombre,
                apellido: solicitudEmpleo.apellido,
                zonaTrabajo: solicitudEmpleo.zonaTrabajo,
                telefono: '***',
                email: '***',
                estado: solicitudEmpleo.estado,
            },
            ip: auditContext.ip,
            userAgent: auditContext.userAgent,
        });

        return plainToInstance(SolicitudEmpleoDTO, solicitudEmpleo);
    }
}