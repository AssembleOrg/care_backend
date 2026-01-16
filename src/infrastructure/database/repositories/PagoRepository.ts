import { prisma } from '../PrismaService';
import { Pago } from '@/src/domain/entities/Pago';
import { IPagoRepository } from '@/src/domain/repositories/IPagoRepository';

export class PagoRepository implements IPagoRepository {
  async findById(id: string): Promise<Pago | null> {
    const data = await prisma.pago.findUnique({ where: { id } });
    if (!data) return null;
    return this.toEntity(data);
  }

  async findAll(skip?: number, take?: number): Promise<Pago[]> {
    const data = await prisma.pago.findMany({
      skip,
      take,
      orderBy: { fecha: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async findByCuidadorId(cuidadorId: string, from?: Date, to?: Date): Promise<Pago[]> {
    const where: { cuidadorId: string; fecha?: { gte?: Date; lte?: Date } } = { cuidadorId };
    if (from || to) {
      where.fecha = {};
      if (from) where.fecha.gte = from;
      if (to) where.fecha.lte = to;
    }
    const data = await prisma.pago.findMany({
      where,
      orderBy: { fecha: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async findByPersonaId(personaId: string): Promise<Pago[]> {
    const data = await prisma.pago.findMany({
      where: { personaId },
      orderBy: { fecha: 'desc' },
    });
    return data.map(this.toEntity);
  }

  async create(data: Omit<Pago, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pago> {
    const created = await prisma.pago.create({
      data: {
        cuidadorId: data.cuidadorId,
        personaId: data.personaId,
        monto: data.monto,
        fecha: data.fecha,
        metodo: data.metodo,
        nota: data.nota,
        esLiquidacion: data.esLiquidacion || false,
        precioPorHora: data.precioPorHora,
        horasTrabajadas: data.horasTrabajadas,
        semanaInicio: data.semanaInicio,
        semanaFin: data.semanaFin,
        horarios: data.horarios,
      },
    });
    return this.toEntity(created);
  }

  async update(id: string, data: Partial<Omit<Pago, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Pago> {
    const updated = await prisma.pago.update({
      where: { id },
      data: {
        ...(data.cuidadorId !== undefined && { cuidadorId: data.cuidadorId }),
        ...(data.personaId !== undefined && { personaId: data.personaId }),
        ...(data.monto !== undefined && { monto: data.monto }),
        ...(data.fecha !== undefined && { fecha: data.fecha }),
        ...(data.metodo !== undefined && { metodo: data.metodo }),
        ...(data.nota !== undefined && { nota: data.nota }),
        ...(data.esLiquidacion !== undefined && { esLiquidacion: data.esLiquidacion }),
        ...(data.precioPorHora !== undefined && { precioPorHora: data.precioPorHora }),
        ...(data.horasTrabajadas !== undefined && { horasTrabajadas: data.horasTrabajadas }),
        ...(data.semanaInicio !== undefined && { semanaInicio: data.semanaInicio }),
        ...(data.semanaFin !== undefined && { semanaFin: data.semanaFin }),
        ...(data.horarios !== undefined && { horarios: data.horarios }),
      },
    });
    return this.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.pago.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return prisma.pago.count();
  }

  async getTotalByCuidador(cuidadorId: string, from?: Date, to?: Date): Promise<{ total: number; count: number }> {
    const where: { cuidadorId: string; fecha?: { gte?: Date; lte?: Date } } = { cuidadorId };
    if (from || to) {
      where.fecha = {};
      if (from) where.fecha.gte = from;
      if (to) where.fecha.lte = to;
    }

    const [aggregate, count] = await Promise.all([
      prisma.pago.aggregate({
        where,
        _sum: { monto: true },
      }),
      prisma.pago.count({ where }),
    ]);

    return {
      total: aggregate._sum.monto ? Number(aggregate._sum.monto) : 0,
      count,
    };
  }

  private toEntity(data: NonNullable<Awaited<ReturnType<typeof prisma.pago.findUnique>>>): Pago {
    return new Pago(
      data.id,
      data.cuidadorId,
      data.personaId,
      Number(data.monto),
      data.fecha,
      data.metodo,
      data.nota,
      data.createdAt,
      data.updatedAt,
      data.esLiquidacion || false,
      data.precioPorHora ? Number(data.precioPorHora) : null,
      data.horasTrabajadas ? Number(data.horasTrabajadas) : null,
      data.semanaInicio ? new Date(data.semanaInicio) : null,
      data.semanaFin ? new Date(data.semanaFin) : null,
      (data.horarios && Array.isArray(data.horarios) ? (data.horarios as unknown as Array<{ dia: number; horaInicio: string; horaFin: string; horas: number }>) : undefined),
    );
  }
}
