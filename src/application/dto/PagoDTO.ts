import { Expose } from 'class-transformer';

export class PagoDTO {
  @Expose()
  id: string;

  @Expose()
  cuidadorId: string;

  @Expose()
  personaId: string | null;

  @Expose()
  asignacionId: string | null;

  @Expose()
  monto: number;

  @Expose()
  fecha: Date;

  @Expose()
  metodo: string;

  @Expose()
  nota: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
