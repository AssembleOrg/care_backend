import { MensajeContacto } from "../entities/MensajeContacto";

export interface IMensajeContactoRepository {
    create(mensaje: Omit<MensajeContacto, 'id' | 'createdAt' | 'updatedAt'>): Promise<MensajeContacto>;
    findAll(skip?: number, take?: number, search?: string): Promise<MensajeContacto[]>;
    findById(id: string): Promise<MensajeContacto | null>;
    setLeido(id: string, leido: boolean): Promise<MensajeContacto>;
    count(search?: string): Promise<number>;
}
