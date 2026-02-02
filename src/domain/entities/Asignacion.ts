export interface Horario {
  diaSemana: number; // 0 = lunes, 6 = domingo (opcional)
}

export interface CuidadorAsignacion {
  horas: number;
  precioPorHora: number;
}

export interface HorasPorCuidador {
  [cuidadorId: string]: CuidadorAsignacion; // { horas: number, precioPorHora: number }
}

export class Asignacion {
  constructor(
    public id: string,
    public personaId: string,
    public fechaInicio: Date,
    public fechaFin: Date | null,
    public horarios: Horario[] | null, // Opcional: Array de { diaSemana: 0-6 }
    public horasPorCuidador: HorasPorCuidador | null, // { cuidadorId: { horas: number, precioPorHora: number } }
    public notas: string | null,
    public cuidadoresIds: string[], // Array de IDs de cuidadores
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
