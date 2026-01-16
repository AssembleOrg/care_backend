import { prisma } from '../PrismaService';
import { PersonaAsistida } from '@/src/domain/entities/PersonaAsistida';
import { IPersonaAsistidaRepository } from '@/src/domain/repositories/IPersonaAsistidaRepository';

export class PersonaAsistidaRepository implements IPersonaAsistidaRepository {
  async findById(id: string): Promise<PersonaAsistida | null> {
    const data = await prisma.personaAsistida.findUnique({ where: { id } });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findAll(skip?: number, take?: number, search?: string): Promise<PersonaAsistida[]> {
    const where = search
      ? {
          nombreCompleto: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : undefined;

    const data = await prisma.personaAsistida.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async findByDniHash(dniHash: string): Promise<PersonaAsistida | null> {
    const data = await prisma.personaAsistida.findUnique({ where: { dniHash } });
    if (!data) return null;
    return this.toEntity(data);
  }

  async create(data: Omit<PersonaAsistida, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersonaAsistida> {
    const created = await prisma.personaAsistida.create({
      data: {
        nombreCompleto: data.nombreCompleto,
        dniEnc: data.dniEnc,
        dniHash: data.dniHash,
        telefonoEnc: data.telefonoEnc,
        telefonoHash: data.telefonoHash,
        direccionEnc: data.direccionEnc,
        direccionHash: data.direccionHash,
        telefonoContactoEmergenciaEnc: data.telefonoContactoEmergenciaEnc,
        telefonoContactoEmergenciaHash: data.telefonoContactoEmergenciaHash,
      },
    });
    return this.toEntity(created);
  }

  async update(id: string, data: Partial<Omit<PersonaAsistida, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PersonaAsistida> {
    const updated = await prisma.personaAsistida.update({
      where: { id },
      data: {
        ...(data.nombreCompleto !== undefined && { nombreCompleto: data.nombreCompleto }),
        ...(data.dniEnc !== undefined && { dniEnc: data.dniEnc }),
        ...(data.dniHash !== undefined && { dniHash: data.dniHash }),
        ...(data.telefonoEnc !== undefined && { telefonoEnc: data.telefonoEnc }),
        ...(data.telefonoHash !== undefined && { telefonoHash: data.telefonoHash }),
        ...(data.direccionEnc !== undefined && { direccionEnc: data.direccionEnc }),
        ...(data.direccionHash !== undefined && { direccionHash: data.direccionHash }),
        ...(data.telefonoContactoEmergenciaEnc !== undefined && { telefonoContactoEmergenciaEnc: data.telefonoContactoEmergenciaEnc }),
        ...(data.telefonoContactoEmergenciaHash !== undefined && { telefonoContactoEmergenciaHash: data.telefonoContactoEmergenciaHash }),
      },
    });
    return this.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.personaAsistida.delete({ where: { id } });
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

    return prisma.personaAsistida.count({ where });
  }

  private toEntity(data: NonNullable<Awaited<ReturnType<typeof prisma.personaAsistida.findUnique>>>): PersonaAsistida {
    return new PersonaAsistida(
      data.id,
      data.nombreCompleto,
      data.dniEnc,
      data.dniHash,
      data.telefonoEnc,
      data.telefonoHash,
      data.direccionEnc,
      data.direccionHash,
      data.telefonoContactoEmergenciaEnc,
      data.telefonoContactoEmergenciaHash,
      data.createdAt,
      data.updatedAt,
    );
  }
}
