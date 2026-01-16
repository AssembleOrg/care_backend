import { Expose, Transform } from 'class-transformer';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';

export class CuidadorDTO {
  @Expose()
  id: string;

  @Expose()
  nombreCompleto: string;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.dniEnc) return null;
    try {
      return encryptionService.decrypt(obj.dniEnc);
    } catch {
      return null;
    }
  })
  dni?: string | null;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.telefonoEnc) return null;
    try {
      return encryptionService.decrypt(obj.telefonoEnc);
    } catch {
      return null;
    }
  })
  telefono?: string | null;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.emailEnc) return null;
    try {
      return encryptionService.decrypt(obj.emailEnc);
    } catch {
      return null;
    }
  })
  email?: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
