import { Expose, Transform } from 'class-transformer';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';

export class ContratoDTO {
    @Expose()
    id: string;

    @Expose()
    idCliente: string | null;

    @Expose()
    @Transform(({ obj }) => {
        if (!obj.nombreManual) return null;
        try {
            return encryptionService.decrypt(obj.nombreManual);
        } catch {
            return null;
        }
    })
    nombreManual: string | null;

    @Expose()
    @Transform(({ obj }) => {
        if (!obj.cuitManual) return null;
        try {
            return encryptionService.decrypt(obj.cuitManual);
        } catch {
            return null;
        }
    })
    cuitManual: string | null;

    @Expose()
    @Transform(({ obj }) => {
        if (!obj.direccionManual) return null;
        try {
            return encryptionService.decrypt(obj.direccionManual);
        } catch {
            return null;
        }
    })
    direccionManual: string | null;

    @Expose()
    @Transform(({ obj }) => {
        if (!obj.telefonoEmergencia) return null;
        try {
            return encryptionService.decrypt(obj.telefonoEmergencia);
        } catch {
            return null;
        }
    })
    telefonoEmergencia: string | null;

    @Expose()
    fechaInicio: Date;

    @Expose()
    fechaFin: Date;

    @Expose()
    createdAt: Date;
}