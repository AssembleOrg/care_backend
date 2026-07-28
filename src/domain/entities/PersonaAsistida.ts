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
    /** Punto exacto del domicilio, para validar el fichaje del cuidador. */
    public lat: number | null = null,
    public lng: number | null = null,
    /** Radio tolerado en metros para dar el fichaje por "en rango". */
    public radioMetros: number = 50,
  ) {}
}
