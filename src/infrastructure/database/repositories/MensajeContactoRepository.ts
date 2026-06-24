import { prisma } from "../PrismaService";
import { MensajeContacto } from "../../../domain/entities/MensajeContacto";
import { IMensajeContactoRepository } from "../../../domain/repositories/IMensajeContactoRepository";

export class MensajeContactoRepository implements IMensajeContactoRepository {
    async create(mensaje: Omit<MensajeContacto, "id" | "createdAt" | "updatedAt">): Promise<MensajeContacto> {
        const result = await prisma.mensajeContacto.create({
            data: {
                nombre: mensaje.nombre,
                telefono: mensaje.telefono,
                email: mensaje.email,
                mensaje: mensaje.mensaje,
                leido: mensaje.leido,
            }
        });
        return this.toEntity(result);
    }

    async findById(id: string): Promise<MensajeContacto | null> {
        const result = await prisma.mensajeContacto.findUnique({ where: { id } });
        if (!result) return null;
        return this.toEntity(result);
    }

    async findAll(skip?: number, take?: number, search?: string): Promise<MensajeContacto[]> {
        const where: any = {
            ...(search && {
                nombre: { contains: search, mode: 'insensitive' },
            })
        };

        const result = await prisma.mensajeContacto.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' }
        });

        return result.map(this.toEntity);
    }

    async setLeido(id: string, leido: boolean): Promise<MensajeContacto> {
        const result = await prisma.mensajeContacto.update({
            where: { id },
            data: { leido }
        });
        return this.toEntity(result);
    }

    async count(search?: string): Promise<number> {
        const where: any = {
            ...(search && {
                nombre: { contains: search, mode: 'insensitive' },
            })
        };
        return await prisma.mensajeContacto.count({ where });
    }

    private toEntity(data: NonNullable<Awaited<ReturnType<typeof prisma.mensajeContacto.findUnique>>>): MensajeContacto {
        return new MensajeContacto(
            data.id,
            data.nombre,
            data.telefono,
            data.email,
            data.mensaje,
            data.leido,
            data.createdAt,
            data.updatedAt,
        );
    }
}
