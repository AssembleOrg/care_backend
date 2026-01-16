export class Pago {
  constructor(
    public id: string,
    public cuidadorId: string,
    public personaId: string | null,
    public monto: number,
    public fecha: Date,
    public metodo: string,
    public nota: string | null,
    public createdAt: Date,
    public updatedAt: Date,
    public esLiquidacion?: boolean,
    public precioPorHora?: number | null,
    public horasTrabajadas?: number | null,
    public semanaInicio?: Date | null,
    public semanaFin?: Date | null,
    public horarios?: Array<{ dia: number; horaInicio: string; horaFin: string; horas: number }>,
  ) {}
}
