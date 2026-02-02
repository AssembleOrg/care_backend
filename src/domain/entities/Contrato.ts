export class Contrato {
    constructor(
        public id: string,
        public idCliente: string | null,
        public nombreManual: string | null,
        public nombreManualHash: string | null,
        public cuitManual: string | null,
        public cuitManualHash: string | null,
        public direccionManual: string | null,
        public direccionManualHash: string | null,
        public telefonoEmergencia: string | null,
        public telefonoEmergenciaHash: string | null,
        public fechaInicio: Date,
        public fechaFin: Date,
        public createdAt: Date,
    ) { }
}