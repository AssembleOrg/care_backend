import { Contrato } from "../entities/Contrato";

export interface IContratoRepository {
    findById(id: string): Promise<Contrato | null>;
    findAll(skip?: number, take?: number): Promise<Contrato[]>;
    create(data: Omit<Contrato, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contrato>;
    delete(id: string): Promise<void>;
    count(): Promise<number>;
}