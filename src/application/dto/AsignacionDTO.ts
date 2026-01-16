import { Expose } from 'class-transformer';
import { Horario } from '@/src/domain/entities/Asignacion';

export class AsignacionDTO {
  @Expose()
  id: string;

  @Expose()
  cuidadorId: string;

  @Expose()
  personaId: string;

  @Expose()
  precioPorHora: number;

  @Expose()
  fechaInicio: Date;

  @Expose()
  fechaFin: Date | null;

  @Expose()
  horarios: Horario[];

  @Expose()
  notas: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
