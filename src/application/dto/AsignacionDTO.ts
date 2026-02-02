import { Expose } from 'class-transformer';
import { Horario, HorasPorCuidador } from '@/src/domain/entities/Asignacion';

export class AsignacionDTO {
  @Expose()
  id: string;

  @Expose()
  personaId: string;

  @Expose()
  fechaInicio: Date;

  @Expose()
  fechaFin: Date | null;

  @Expose()
  horarios: Horario[] | null;

  @Expose()
  horasPorCuidador: HorasPorCuidador | null;

  @Expose()
  notas: string | null;

  @Expose()
  cuidadoresIds: string[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
