export class MensajeContacto {
    constructor(
        public id: string,
        public nombre: string,
        public telefono: string | null,
        public email: string,
        public mensaje: string,
        public leido: boolean,
        public createdAt: Date,
        public updatedAt: Date,
    ) { }
}
