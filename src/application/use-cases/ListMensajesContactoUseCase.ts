import { MensajeContactoRepository } from '@/src/infrastructure/database/repositories/MensajeContactoRepository';
import { MensajeContactoDTO } from '@/src/application/dto/MensajeContactoDTO';
import { plainToInstance } from 'class-transformer';

export class ListMensajesContactoUseCase {
    constructor(private readonly mensajeContactoRepository: MensajeContactoRepository) { }

    async execute(page: number = 1, limit: number = 20, search?: string): Promise<{ data: MensajeContactoDTO[]; total: number; page: number; limit: number }> {
        const skip = (page - 1) * limit;
        const [mensajes, total] = await Promise.all([
            this.mensajeContactoRepository.findAll(skip, limit, search),
            this.mensajeContactoRepository.count(search),
        ]);

        const dtos = mensajes.map(m => plainToInstance(MensajeContactoDTO, m, { excludeExtraneousValues: true }));

        return { data: dtos, total, page, limit };
    }
}
