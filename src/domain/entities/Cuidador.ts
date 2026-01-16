export class Cuidador {
  constructor(
    public id: string,
    public nombreCompleto: string,
    public dniEnc: string,
    public dniHash: string,
    public telefonoEnc: string | null,
    public telefonoHash: string | null,
    public emailEnc: string | null,
    public emailHash: string | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
