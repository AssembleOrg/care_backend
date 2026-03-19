import { EstadoSolicitud } from './EstadoSolicitud';

export class SolicitudEmpleo {
    constructor(
        public id: string,
        public nombre: string,
        public apellido: string,
        public zonaTrabajo: string,
        public telefono: string,
        public telefonoHash: string,
        public email: string,
        public emailHash: string,
        public estado: EstadoSolicitud,
        public createdAt: Date,
        public updatedAt: Date,
    ) { }
}