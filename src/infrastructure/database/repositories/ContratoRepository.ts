import { prisma } from "../PrismaService";
import { Contrato } from "@/src/domain/entities/Contrato";
import { IContratoRepository } from "@/src/domain/repositories/IContratoRepository";

export class ContratoRepository implements IContratoRepository {
    async findById(id: string): Promise<Contrato | null> {
        const data = await prisma.contrato.findUnique({ where: { id } });
        if (!data) return null;
        return this.toEntity(data);
    }

    async findAll(skip?: number, take?: number): Promise<Contrato[]> {
        const data = await prisma.contrato.findMany({
            skip,
            take,
            orderBy: { createdAt: 'desc' }, // Traer los últimos primero
            include: { persona: true } // Incluir datos de persona para mostrar nombre en lista si no es manual
        });
        return data.map(this.toEntity);
    }

    async create(data: Omit<Contrato, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contrato> {
        const created = await prisma.contrato.create({
            data: {
                idCliente: data.idCliente,
                nombreManual: data.nombreManual,
                nombreManualHash: data.nombreManualHash,
                cuitManual: data.cuitManual,
                cuitManualHash: data.cuitManualHash,
                direccionManual: data.direccionManual,
                direccionManualHash: data.direccionManualHash,
                telefonoEmergencia: data.telefonoEmergencia,
                telefonoEmergenciaHash: data.telefonoEmergenciaHash,
                fechaInicio: data.fechaInicio,
                fechaFin: data.fechaFin,
            }
        });
        return this.toEntity(created);
    }

    async delete(id: string): Promise<void> {
        await prisma.contrato.delete({ where: { id } });
    }

    async count(): Promise<number> {
        return prisma.contrato.count();
    }

    private toEntity(data: NonNullable<Awaited<ReturnType<typeof prisma.contrato.findUnique>>>): Contrato {
        return new Contrato(
            data.id,
            data.idCliente,
            data.nombreManual,
            data.nombreManualHash,
            data.cuitManual,
            data.cuitManualHash,
            data.direccionManual,
            data.direccionManualHash,
            data.telefonoEmergencia,
            data.telefonoEmergenciaHash,
            data.fechaInicio,
            data.fechaFin,
            data.createdAt,
        );
    }
}

