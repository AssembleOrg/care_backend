import { prisma } from '../PrismaService';
import { Asignacion, Horario, HorasPorCuidador } from '@/src/domain/entities/Asignacion';
import { IAsignacionRepository } from '@/src/domain/repositories/IAsignacionRepository';
import { Prisma } from '@prisma/client';

type PrismaAsignacion = NonNullable<Awaited<ReturnType<typeof prisma.asignacion.findUnique>>>;

export class AsignacionRepository implements IAsignacionRepository {
  async findById(id: string): Promise<Asignacion | null> {
    const data = await prisma.asignacion.findUnique({ 
      where: { id },
      include: { cuidadores: true },
    });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findAll(skip?: number, take?: number): Promise<Asignacion[]> {
    const data = await prisma.asignacion.findMany({
      skip,
      take,
      include: { cuidadores: true },
      orderBy: { createdAt: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async findByCuidadorId(cuidadorId: string): Promise<Asignacion[]> {
    const data = await prisma.asignacion.findMany({
      where: { 
        cuidadores: {
          some: { cuidadorId },
        },
      },
      include: { cuidadores: true },
      orderBy: { fechaInicio: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async findByPersonaId(personaId: string): Promise<Asignacion[]> {
    const data = await prisma.asignacion.findMany({
      where: { personaId },
      include: { cuidadores: true },
      orderBy: { fechaInicio: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async create(data: Omit<Asignacion, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asignacion> {
    const createData = {
      personaId: data.personaId,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      horarios: data.horarios ? (data.horarios as unknown as Prisma.InputJsonValue) : undefined,
      horasPorCuidador: data.horasPorCuidador ? (data.horasPorCuidador as unknown as Prisma.InputJsonValue) : undefined,
      notas: data.notas,
      cuidadores: {
        create: data.cuidadoresIds.map(cuidadorId => ({
          cuidadorId,
        })),
      },
    } as unknown as Prisma.AsignacionCreateInput;
    
    const created = await prisma.asignacion.create({
      data: createData,
      include: { cuidadores: true },
    });
    return this.toEntity(created);
  }

  async update(id: string, data: Partial<Omit<Asignacion, 'id' | 'createdAt' | 'updatedAt' | 'personaId'>>): Promise<Asignacion> {
    const updateData: {
      fechaInicio?: Date;
      fechaFin?: Date | null;
      horarios?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
      horasPorCuidador?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
      notas?: string | null;
      cuidadores?: Prisma.AsignacionUpdateInput['cuidadores'];
    } = {};
    
    if (data.fechaInicio !== undefined) updateData.fechaInicio = data.fechaInicio;
    if (data.fechaFin !== undefined) updateData.fechaFin = data.fechaFin;
    if (data.horarios !== undefined) {
      updateData.horarios = data.horarios ? (data.horarios as unknown as Prisma.InputJsonValue) : (Prisma.JsonNull as unknown as Prisma.NullableJsonNullValueInput);
    }
    if (data.horasPorCuidador !== undefined) {
      updateData.horasPorCuidador = data.horasPorCuidador ? (data.horasPorCuidador as unknown as Prisma.InputJsonValue) : (Prisma.JsonNull as unknown as Prisma.NullableJsonNullValueInput);
    }
    if (data.notas !== undefined) updateData.notas = data.notas;

    // Si se actualizan los cuidadores, reemplazar todos
    if (data.cuidadoresIds !== undefined) {
      // Eliminar todos los cuidadores existentes
      await prisma.asignacionCuidador.deleteMany({
        where: { asignacionId: id },
      });
      
      // Crear nuevos
      updateData.cuidadores = {
        create: data.cuidadoresIds.map(cuidadorId => ({
          cuidadorId,
        })),
      };
    }

    const updated = await prisma.asignacion.update({
      where: { id },
      data: updateData,
      include: { cuidadores: true },
    });
    return this.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.asignacion.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return prisma.asignacion.count();
  }

  private toEntity(data: PrismaAsignacion & { cuidadores?: Array<{ cuidadorId: string }> }): Asignacion {
    return new Asignacion(
      data.id,
      data.personaId,
      data.fechaInicio,
      data.fechaFin,
      (data.horarios && Array.isArray(data.horarios) ? (data.horarios as unknown as Horario[]) : null),
      (data.horasPorCuidador ? (data.horasPorCuidador as unknown as HorasPorCuidador) : null),
      data.notas,
      data.cuidadores?.map(c => c.cuidadorId) || [],
      data.createdAt,
      data.updatedAt,
    );
  }
}
