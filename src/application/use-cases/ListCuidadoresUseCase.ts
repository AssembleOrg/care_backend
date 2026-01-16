import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { CuidadorDTO } from '../dto/CuidadorDTO';
import { plainToInstance } from 'class-transformer';

export class ListCuidadoresUseCase {
  constructor(private repository: CuidadorRepository) {}

  async execute(page: number = 1, limit: number = 20, search?: string): Promise<{ data: CuidadorDTO[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [cuidadores, total] = await Promise.all([
      this.repository.findAll(skip, limit, search),
      this.repository.count(search),
    ]);

    const dtos = cuidadores.map(c => plainToInstance(CuidadorDTO, c, { excludeExtraneousValues: true }));

    return {
      data: dtos,
      total,
      page,
      limit,
    };
  }
}
