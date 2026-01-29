import { PersonaCuidador } from '../entities/PersonaCuidador';

export interface IPersonaCuidadorRepository {
  findById(id: string): Promise<PersonaCuidador | null>;
  findByPersonaId(personaId: string): Promise<PersonaCuidador[]>;
  findByCuidadorId(cuidadorId: string): Promise<PersonaCuidador[]>;
  findActivosByPersonaId(personaId: string): Promise<PersonaCuidador[]>;
  create(data: Omit<PersonaCuidador, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersonaCuidador>;
  update(id: string, data: Partial<Omit<PersonaCuidador, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PersonaCuidador>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
