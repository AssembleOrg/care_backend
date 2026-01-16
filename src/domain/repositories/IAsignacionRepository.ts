import { Asignacion } from '../entities/Asignacion';

export interface IAsignacionRepository {
  findById(id: string): Promise<Asignacion | null>;
  findAll(skip?: number, take?: number): Promise<Asignacion[]>;
  findByCuidadorId(cuidadorId: string): Promise<Asignacion[]>;
  findByPersonaId(personaId: string): Promise<Asignacion[]>;
  create(data: Omit<Asignacion, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asignacion>;
  update(id: string, data: Partial<Omit<Asignacion, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Asignacion>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
