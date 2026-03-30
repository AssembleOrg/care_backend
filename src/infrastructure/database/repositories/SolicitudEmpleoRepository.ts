import { prisma } from "../PrismaService";
import { SolicitudEmpleo } from "../../../domain/entities/SolicitudEmpleo";
import { EstadoSolicitud } from "../../../domain/entities/EstadoSolicitud";
import { ISolicitudEmpleoRepository } from "../../../domain/repositories/ISolicitudEmpleoRepository";

export class SolicitudEmpleoRepository implements ISolicitudEmpleoRepository {
    async create(solicitud: Omit<SolicitudEmpleo, "id" | "createdAt" | "updatedAt">): Promise<SolicitudEmpleo> {
        const result = await prisma.solicitudEmpleo.create({
            data: {
                nombre: solicitud.nombre,
                apellido: solicitud.apellido,
                zonaTrabajo: solicitud.zonaTrabajo,
                telefono: solicitud.telefono,
                telefonoHash: solicitud.telefonoHash,
                email: solicitud.email,
                emailHash: solicitud.emailHash,
                estado: solicitud.estado,
                experiencia: solicitud.experiencia,
                experienciaHash: solicitud.experienciaHash,
            }
        });

        return this.toEntity(result);
    }

    async findById(id: string): Promise<SolicitudEmpleo | null> {
        const result = await prisma.solicitudEmpleo.findUnique({
            where: { id }
        });

        if (!result) return null;
        return this.toEntity(result);
    }

    async findAll(skip?: number, take?: number, search?: string, estado?: EstadoSolicitud): Promise<SolicitudEmpleo[]> {
        const where: any = {
            ...(estado && { estado }),
            ...(search && {
                OR: [
                    { nombre: { contains: search, mode: 'insensitive' } },
                    { apellido: { contains: search, mode: 'insensitive' } }
                ]
            })
        };

        const result = await prisma.solicitudEmpleo.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' }
        });

        return result.map(this.toEntity);
    }

    async updateEstado(id: string, estado: EstadoSolicitud): Promise<SolicitudEmpleo> {
        const result = await prisma.solicitudEmpleo.update({
            where: { id },
            data: { estado }
        });

        return this.toEntity(result);
    }

    async count(search?: string, estado?: EstadoSolicitud): Promise<number> {
        const where: any = {
            ...(estado && { estado }),
            ...(search && {
                OR: [
                    { nombre: { contains: search, mode: 'insensitive' } },
                    { apellido: { contains: search, mode: 'insensitive' } }
                ]
            })
        };
        return await prisma.solicitudEmpleo.count({ where });
    }

    private toEntity(data: NonNullable<Awaited<ReturnType<typeof prisma.solicitudEmpleo.findUnique>>>): SolicitudEmpleo {
        return new SolicitudEmpleo(
            data.id,
            data.nombre,
            data.apellido,
            data.zonaTrabajo,
            data.telefono,
            data.telefonoHash,
            data.email,
            data.emailHash,
            data.estado as EstadoSolicitud,
            data.experiencia,
            data.experienciaHash,
            data.createdAt,
            data.updatedAt,
        );
    }
}
