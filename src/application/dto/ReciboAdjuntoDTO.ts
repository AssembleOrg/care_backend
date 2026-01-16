import { Expose } from 'class-transformer';

export class ReciboAdjuntoDTO {
  @Expose()
  id: string;

  @Expose()
  pagoId: string;

  @Expose()
  url: string;

  @Expose()
  filename: string;

  @Expose()
  createdAt: Date;
}
