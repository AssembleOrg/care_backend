import { SolicitudEmpleo } from "../entities/SolicitudEmpleo";
import { EstadoSolicitud } from "../entities/EstadoSolicitud";

export interface ISolicitudEmpleoRepository {
    create(solicitud: Omit<SolicitudEmpleo, 'id' | 'createdAt' | 'updatedAt'>): Promise<SolicitudEmpleo>;
    findAll(skip?: number, take?: number, search?: string, estado?: EstadoSolicitud): Promise<SolicitudEmpleo[]>;
    updateEstado(id: string, estado: EstadoSolicitud): Promise<SolicitudEmpleo>;
    count(search?: string, estado?: EstadoSolicitud): Promise<number>;
}
