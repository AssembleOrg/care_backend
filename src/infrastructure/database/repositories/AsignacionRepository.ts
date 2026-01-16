import { prisma } from '../PrismaService';
import { Asignacion, Horario } from '@/src/domain/entities/Asignacion';
import { IAsignacionRepository } from '@/src/domain/repositories/IAsignacionRepository';

type PrismaAsignacion = NonNullable<Awaited<ReturnType<typeof prisma.asignacion.findUnique>>>;

export class AsignacionRepository implements IAsignacionRepository {
  async findById(id: string): Promise<Asignacion | null> {
    const data = await prisma.asignacion.findUnique({ where: { id } });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findAll(skip?: number, take?: number): Promise<Asignacion[]> {
    const data = await prisma.asignacion.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async findByCuidadorId(cuidadorId: string): Promise<Asignacion[]> {
    const data = await prisma.asignacion.findMany({
      where: { cuidadorId },
      orderBy: { fechaInicio: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async findByPersonaId(personaId: string): Promise<Asignacion[]> {
    const data = await prisma.asignacion.findMany({
      where: { personaId },
      orderBy: { fechaInicio: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async create(data: Omit<Asignacion, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asignacion> {
    const created = await prisma.asignacion.create({
      data: {
        cuidadorId: data.cuidadorId,
        personaId: data.personaId,
        precioPorHora: data.precioPorHora,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        horarios: data.horarios as any,
        notas: data.notas,
      },
    });
    return this.toEntity(created);
  }

  async update(id: string, data: Partial<Omit<Asignacion, 'id' | 'createdAt' | 'updatedAt' | 'cuidadorId' | 'personaId'>>): Promise<Asignacion> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    
    if (data.precioPorHora !== undefined) updateData.precioPorHora = data.precioPorHora;
    if (data.fechaInicio !== undefined) updateData.fechaInicio = data.fechaInicio;
    if (data.fechaFin !== undefined) updateData.fechaFin = data.fechaFin;
    if (data.horarios !== undefined) updateData.horarios = data.horarios;
    if (data.notas !== undefined) updateData.notas = data.notas;

    const updated = await prisma.asignacion.update({
      where: { id },
      data: updateData,
    });
    return this.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.asignacion.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return prisma.asignacion.count();
  }

  private toEntity(data: PrismaAsignacion): Asignacion {
    return new Asignacion(
      data.id,
      data.cuidadorId,
      data.personaId,
      Number(data.precioPorHora),
      data.fechaInicio,
      data.fechaFin,
      (Array.isArray(data.horarios) ? (data.horarios as unknown as Horario[]) : []),
      data.notas,
      data.createdAt,
      data.updatedAt,
    );
  }
}
