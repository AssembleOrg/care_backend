import { Cuidador } from '../entities/Cuidador';

export interface ICuidadorRepository {
  findById(id: string): Promise<Cuidador | null>;
  findAll(skip?: number, take?: number): Promise<Cuidador[]>;
  findByDniHash(dniHash: string): Promise<Cuidador | null>;
  findByEmailHash(emailHash: string): Promise<Cuidador | null>;
  create(data: Omit<Cuidador, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cuidador>;
  update(id: string, data: Partial<Omit<Cuidador, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Cuidador>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
