export class Pago {
  constructor(
    public id: string,
    public cuidadorId: string,
    public personaId: string | null,
    public asignacionId: string | null,
    public monto: number,
    public fecha: Date,
    public metodo: string,
    public nota: string | null,
    public createdAt: Date,
    public updatedAt: Date,
    public precioPorHora: number,
    public horasTrabajadas: number,
    public semanaInicio: Date,
    public semanaFin: Date,
    public horarios?: Array<{ dia: number; horaInicio: string; horaFin: string; horas: number }>,
  ) {}
}
