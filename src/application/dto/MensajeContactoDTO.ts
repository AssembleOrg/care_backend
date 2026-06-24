import { Expose, Transform } from 'class-transformer';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';

export class MensajeContactoDTO {
    @Expose()
    id: string;

    @Expose()
    nombre: string;

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
    @Transform(({ obj }) => {
        if (!obj.mensaje) return null;
        try {
            return encryptionService.decrypt(obj.mensaje);
        } catch {
            return null;
        }
    })
    mensaje: string | null;

    @Expose()
    leido: boolean;

    @Expose()
    createdAt: Date;
}
