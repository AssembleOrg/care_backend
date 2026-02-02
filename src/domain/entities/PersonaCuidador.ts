export class PersonaCuidador {
  constructor(
    public id: string,
    public personaId: string,
    public cuidadorId: string,
    public fechaInicio: Date,
    public fechaFin: Date | null,
    public activo: boolean,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
