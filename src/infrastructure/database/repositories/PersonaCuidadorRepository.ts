import { prisma } from '../PrismaService';
import { PersonaCuidador } from '@/src/domain/entities/PersonaCuidador';
import { IPersonaCuidadorRepository } from '@/src/domain/repositories/IPersonaCuidadorRepository';

type PrismaPersonaCuidador = NonNullable<Awaited<ReturnType<typeof prisma.personaCuidador.findUnique>>>;

export class PersonaCuidadorRepository implements IPersonaCuidadorRepository {
  async findById(id: string): Promise<PersonaCuidador | null> {
    const data = await prisma.personaCuidador.findUnique({
      where: { id },
    });
    return data ? this.toEntity(data) : null;
  }

  async findByPersonaId(personaId: string): Promise<PersonaCuidador[]> {
    const data = await prisma.personaCuidador.findMany({
      where: { personaId },
      orderBy: { fechaInicio: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async findByCuidadorId(cuidadorId: string): Promise<PersonaCuidador[]> {
    const data = await prisma.personaCuidador.findMany({
      where: { cuidadorId },
      orderBy: { fechaInicio: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async findActivosByPersonaId(personaId: string): Promise<PersonaCuidador[]> {
    const data = await prisma.personaCuidador.findMany({
      where: {
        personaId,
        activo: true,
        OR: [
          { fechaFin: null },
          { fechaFin: { gte: new Date() } },
        ],
      },
      orderBy: { fechaInicio: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async create(data: Omit<PersonaCuidador, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersonaCuidador> {
    const created = await prisma.personaCuidador.create({
      data: {
        personaId: data.personaId,
        cuidadorId: data.cuidadorId,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        activo: data.activo,
      },
    });
    return this.toEntity(created);
  }

  async update(id: string, data: Partial<Omit<PersonaCuidador, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PersonaCuidador> {
    const updated = await prisma.personaCuidador.update({
      where: { id },
      data: {
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        activo: data.activo,
      },
    });
    return this.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.personaCuidador.delete({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return prisma.personaCuidador.count();
  }

  private toEntity(data: PrismaPersonaCuidador): PersonaCuidador {
    return new PersonaCuidador(
      data.id,
      data.personaId,
      data.cuidadorId,
      data.fechaInicio,
      data.fechaFin,
      data.activo,
      data.createdAt,
      data.updatedAt,
    );
  }
}
