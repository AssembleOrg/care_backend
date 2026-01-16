import { Pago } from '../entities/Pago';

export interface IPagoRepository {
  findById(id: string): Promise<Pago | null>;
  findAll(skip?: number, take?: number): Promise<Pago[]>;
  findByCuidadorId(cuidadorId: string, from?: Date, to?: Date): Promise<Pago[]>;
  findByPersonaId(personaId: string): Promise<Pago[]>;
  create(data: Omit<Pago, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pago>;
  update(id: string, data: Partial<Omit<Pago, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Pago>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
  getTotalByCuidador(cuidadorId: string, from?: Date, to?: Date): Promise<{ total: number; count: number }>;
}
