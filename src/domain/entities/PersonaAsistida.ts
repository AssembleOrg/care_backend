export class PersonaAsistida {
  constructor(
    public id: string,
    public nombreCompleto: string,
    public dniEnc: string | null,
    public dniHash: string | null,
    public telefonoEnc: string | null,
    public telefonoHash: string | null,
    public direccionEnc: string | null,
    public direccionHash: string | null,
    public telefonoContactoEmergenciaEnc: string | null,
    public telefonoContactoEmergenciaHash: string | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
