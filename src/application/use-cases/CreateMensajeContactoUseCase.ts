import { z } from 'zod';
import { MensajeContactoRepository } from '@/src/infrastructure/database/repositories/MensajeContactoRepository';
import { encryptionService } from '@/src/infrastructure/crypto/EncryptionService';
import { MensajeContactoDTO } from '../dto/MensajeContactoDTO';
import { plainToInstance } from 'class-transformer';

const createMensajeContactoSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    telefono: z.string().optional(),
    email: z.email('El email debe ser un correo electrónico válido'),
    mensaje: z.string().min(1, 'El mensaje es requerido').max(2000, 'El mensaje es demasiado largo'),
});

export class CreateMensajeContactoUseCase {
    constructor(private readonly mensajeContactoRepository: MensajeContactoRepository) { }

    async execute(data: z.infer<typeof createMensajeContactoSchema>): Promise<MensajeContactoDTO> {
        const validatedData = createMensajeContactoSchema.parse(data);

        const telefonoEnc = validatedData.telefono ? encryptionService.encrypt(validatedData.telefono) : null;
        const emailEnc = encryptionService.encrypt(validatedData.email);
        const mensajeEnc = encryptionService.encrypt(validatedData.mensaje);

        const mensajeContacto = await this.mensajeContactoRepository.create({
            nombre: validatedData.nombre,
            telefono: telefonoEnc,
            email: emailEnc,
            mensaje: mensajeEnc,
            leido: false,
        });

        return plainToInstance(MensajeContactoDTO, mensajeContacto, { excludeExtraneousValues: true });
    }
}
