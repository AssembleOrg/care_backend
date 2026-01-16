export interface Horario {
  diaSemana: number; // 0 = lunes, 6 = domingo
  horaInicio: string; // "HH:MM"
  horaFin: string; // "HH:MM"
}

export class Asignacion {
  constructor(
    public id: string,
    public cuidadorId: string,
    public personaId: string,
    public precioPorHora: number,
    public fechaInicio: Date,
    public fechaFin: Date | null,
    public horarios: Horario[], // Array de { diaSemana: 0-6, horaInicio: "HH:MM", horaFin: "HH:MM" }
    public notas: string | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
