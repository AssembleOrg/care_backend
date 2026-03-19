import { SolicitudEmpleoRepository } from '@/src/infrastructure/database/repositories/SolicitudEmpleoRepository';
import { SolicitudEmpleoDTO } from '@/src/application/dto/SolicitudEmpleoDTO';
import { plainToInstance } from 'class-transformer';
import { EstadoSolicitud } from '@/src/domain/entities/EstadoSolicitud';
import { auditService } from '@/src/infrastructure/audit/AuditService';

export class UpdateSolicitudEmpleoUseCase {
    constructor(private readonly solicitudEmpleoRepository: SolicitudEmpleoRepository) { }

    async execute(id: string, estado: EstadoSolicitud, auditContext: { ip?: string; userAgent?: string }): Promise<SolicitudEmpleoDTO> {
        const solicitudEmpleo = await this.solicitudEmpleoRepository.updateEstado(id, estado);

        await auditService.log({
            actor: 'ADMIN',
            action: 'UPDATE',
            table: 'Solicitud_Empleo',
            recordId: solicitudEmpleo.id,
            newData: {
                estado: solicitudEmpleo.estado,
            },
            ip: auditContext.ip,
            userAgent: auditContext.userAgent,
        });

        return plainToInstance(SolicitudEmpleoDTO, solicitudEmpleo);
    }
}