import { z } from 'zod';
import { PagoRepository } from '@/src/infrastructure/database/repositories/PagoRepository';
import { CuidadorRepository } from '@/src/infrastructure/database/repositories/CuidadorRepository';
import { PersonaAsistidaRepository } from '@/src/infrastructure/database/repositories/PersonaAsistidaRepository';
import { auditService } from '@/src/infrastructure/audit/AuditService';
import { PagoDTO } from '../dto/PagoDTO';
import { plainToInstance } from 'class-transformer';
import { METODO_PAGO } from '@/src/config/constants';

const createSchema = z.object({
  cuidadorId: z.string().uuid(),
  personaId: z.string().uuid().optional(),
  monto: z.number().positive(),
  fecha: z.coerce.date(),
  metodo: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'OTRO']),
  nota: z.string().optional(),
});

export class CreatePagoUseCase {
  constructor(
    private pagoRepository: PagoRepository,
    private cuidadorRepository: CuidadorRepository,
    private personaRepository: PersonaAsistidaRepository,
  ) {}

  async execute(data: z.infer<typeof createSchema>, auditContext: { ip?: string; userAgent?: string }): Promise<PagoDTO> {
    const validated = createSchema.parse(data);

    // Verify cuidador exists
    const cuidador = await this.cuidadorRepository.findById(validated.cuidadorId);
    if (!cuidador) {
      throw new Error('Cuidador no encontrado');
    }

    // Verify persona exists if provided
    if (validated.personaId) {
      const persona = await this.personaRepository.findById(validated.personaId);
      if (!persona) {
        throw new Error('Persona asistida no encontrada');
      }
    }

    const pago = await this.pagoRepository.create({
      cuidadorId: validated.cuidadorId,
      personaId: validated.personaId || null,
      monto: validated.monto,
      fecha: validated.fecha,
      metodo: validated.metodo,
      nota: validated.nota || null,
    });

    // Audit
    await auditService.log({
      actor: 'ADMIN',
      action: 'CREATE',
      table: 'Pago',
      recordId: pago.id,
      newData: { monto: validated.monto, fecha: validated.fecha, metodo: validated.metodo },
      ip: auditContext.ip,
      userAgent: auditContext.userAgent,
    });

    return plainToInstance(PagoDTO, pago, { excludeExtraneousValues: true });
  }
}
