export class ReciboAdjunto {
  constructor(
    public id: string,
    public pagoId: string,
    public url: string,
    public filename: string,
    public createdAt: Date,
  ) {}
}
