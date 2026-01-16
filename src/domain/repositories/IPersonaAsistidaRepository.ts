import { PersonaAsistida } from '../entities/PersonaAsistida';

export interface IPersonaAsistidaRepository {
  findById(id: string): Promise<PersonaAsistida | null>;
  findAll(skip?: number, take?: number): Promise<PersonaAsistida[]>;
  findByDniHash(dniHash: string): Promise<PersonaAsistida | null>;
  create(data: Omit<PersonaAsistida, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersonaAsistida>;
  update(id: string, data: Partial<Omit<PersonaAsistida, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PersonaAsistida>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
