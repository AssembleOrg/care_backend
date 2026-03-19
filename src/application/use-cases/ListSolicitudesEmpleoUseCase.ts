import { SolicitudEmpleoRepository } from '@/src/infrastructure/database/repositories/SolicitudEmpleoRepository';
import { SolicitudEmpleoDTO } from '@/src/application/dto/SolicitudEmpleoDTO';
import { plainToInstance } from 'class-transformer';
import { EstadoSolicitud } from '@/src/domain/entities/EstadoSolicitud';

export class ListSolicitudesEmpleoUseCase {
    constructor(private readonly solicitudEmpleoRepository: SolicitudEmpleoRepository) { }

    async execute(page: number = 1, limit: number = 20, search?: string, estado?: EstadoSolicitud): Promise<{ data: SolicitudEmpleoDTO[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const [solicitudesEmpleo, total] = await Promise.all([
            this.solicitudEmpleoRepository.findAll(skip, limit, search, estado),
            this.solicitudEmpleoRepository.count(search, estado),
        ]);

        const dtos = solicitudesEmpleo.map(s => plainToInstance(SolicitudEmpleoDTO, s, { excludeExtraneousValues: true }));

        return {
            data: dtos,
            total,
            page,
            limit,
        };
    }
}