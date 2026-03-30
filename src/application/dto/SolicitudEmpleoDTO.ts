import { Expose, Transform } from 'class-transformer';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';
import { EstadoSolicitud } from '@/src/domain/entities/EstadoSolicitud';

export class SolicitudEmpleoDTO {
    @Expose()
    id: string;

    @Expose()
    nombre: string;

    @Expose()
    apellido: string;

    @Expose()
    zonaTrabajo: string;

    @Expose()
    @Transform(({ obj }) => {
        if (!obj.telefono) return null;
        try {
            return encryptionService.decrypt(obj.telefono);
        } catch {
            return null;
        }
    })
    telefono: string | null;

    @Expose()
    @Transform(({ obj }) => {
        if (!obj.email) return null;
        try {
            return encryptionService.decrypt(obj.email);
        } catch {
            return null;
        }
    })
    email: string | null;

    @Expose()
    estado: EstadoSolicitud;

    @Expose()
    @Transform(({ obj }) => {
        if (!obj.experiencia) return null;
        try {
            return encryptionService.decrypt(obj.experiencia);
        } catch {
            return null;
        }
    })
    experiencia?: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}