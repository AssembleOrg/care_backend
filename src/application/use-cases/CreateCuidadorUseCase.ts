import { z } from 'zod';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';
import { hashingService } from '@/src/infrastructure/crypto/HashingService';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { CuidadorDTO } from '../dto/CuidadorDTO';
import { plainToInstance } from 'class-transformer';

const createSchema = z.object({
  nombreCompleto: z.string().min(1),
  dni: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
});

export class CreateCuidadorUseCase {
  constructor(private repository: CuidadorRepository) {}

  async execute(data: z.infer<typeof createSchema>, auditContext: { ip?: string; userAgent?: string }): Promise<CuidadorDTO> {
    const validated = createSchema.parse(data);

    // Check for duplicates
    if (validated.dni) {
      const dniHash = hashingService.hash(validated.dni);
      const existing = await this.repository.findByDniHash(dniHash);
      if (existing) {
        throw new Error('Ya existe un cuidador con este DNI');
      }
    }

    if (validated.email) {
      const emailHash = hashingService.hash(validated.email);
      const existing = await this.repository.findByEmailHash(emailHash);
      if (existing) {
        throw new Error('Ya existe un cuidador con este email');
      }
    }

    // Encrypt and hash
    const dniEnc = validated.dni ? encryptionService.encrypt(validated.dni) : '';
    const dniHash = validated.dni ? hashingService.hash(validated.dni) : '';
    const telefonoEnc = validated.telefono ? encryptionService.encrypt(validated.telefono) : null;
    const telefonoHash = validated.telefono ? hashingService.hash(validated.telefono) : null;
    const emailEnc = validated.email ? encryptionService.encrypt(validated.email) : null;
    const emailHash = validated.email ? hashingService.hash(validated.email) : null;

    const cuidador = await this.repository.create({
      nombreCompleto: validated.nombreCompleto,
      dniEnc,
      dniHash,
      telefonoEnc,
      telefonoHash,
      emailEnc,
      emailHash,
    });

    // Audit
    await auditService.log({
      actor: 'ADMIN',
      action: 'CREATE',
      table: 'Cuidador',
      recordId: cuidador.id,
      newData: { nombreCompleto: validated.nombreCompleto },
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
    });

    return plainToInstance(CuidadorDTO, {
      ...cuidador,
      dni: validated.dni || null,
      telefono: validated.telefono || null,
      email: validated.email || null,
    }, { excludeExtraneousValues: true });
  }
}
