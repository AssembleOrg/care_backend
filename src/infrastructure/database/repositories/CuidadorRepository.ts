import { prisma } from '../PrismaService';
import { Cuidador } from '@/src/domain/entities/Cuidador';
import { ICuidadorRepository } from '@/src/domain/repositories/ICuidadorRepository';

export class CuidadorRepository implements ICuidadorRepository {
  async findById(id: string): Promise<Cuidador | null> {
    const data = await prisma.cuidador.findUnique({ where: { id } });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findAll(skip?: number, take?: number, search?: string): Promise<Cuidador[]> {
    const where = search
      ? {
          nombreCompleto: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : undefined;

    const data = await prisma.cuidador.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async count(search?: string): Promise<number> {
    const where = search
      ? {
          nombreCompleto: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : undefined;

    return prisma.cuidador.count({ where });
  }

  async findByDniHash(dniHash: string): Promise<Cuidador | null> {
    const data = await prisma.cuidador.findUnique({ where: { dniHash } });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findByEmailHash(emailHash: string): Promise<Cuidador | null> {
    const data = await prisma.cuidador.findUnique({ where: { emailHash } });
    if (!data) return null;
    return this.toEntity(data);
  }

  async create(data: Omit<Cuidador, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cuidador> {
    const created = await prisma.cuidador.create({
      data: {
        nombreCompleto: data.nombreCompleto,
        dniEnc: data.dniEnc,
        dniHash: data.dniHash,
        telefonoEnc: data.telefonoEnc,
        telefonoHash: data.telefonoHash,
        emailEnc: data.emailEnc,
        emailHash: data.emailHash,
      },
    });
    return this.toEntity(created);
  }

  async update(id: string, data: Partial<Omit<Cuidador, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Cuidador> {
    const updated = await prisma.cuidador.update({
      where: { id },
      data: {
        ...(data.nombreCompleto !== undefined && { nombreCompleto: data.nombreCompleto }),
        ...(data.dniEnc !== undefined && { dniEnc: data.dniEnc }),
        ...(data.dniHash !== undefined && { dniHash: data.dniHash }),
        ...(data.telefonoEnc !== undefined && { telefonoEnc: data.telefonoEnc }),
        ...(data.telefonoHash !== undefined && { telefonoHash: data.telefonoHash }),
        ...(data.emailEnc !== undefined && { emailEnc: data.emailEnc }),
        ...(data.emailHash !== undefined && { emailHash: data.emailHash }),
      },
    });
    return this.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.cuidador.delete({ where: { id } });
  }

  private toEntity(data: NonNullable<Awaited<ReturnType<typeof prisma.cuidador.findUnique>>>): Cuidador {
    return new Cuidador(
      data.id,
      data.nombreCompleto,
      data.dniEnc,
      data.dniHash,
      data.telefonoEnc,
      data.telefonoHash,
      data.emailEnc,
      data.emailHash,
      data.createdAt,
      data.updatedAt,
    );
  }
}
