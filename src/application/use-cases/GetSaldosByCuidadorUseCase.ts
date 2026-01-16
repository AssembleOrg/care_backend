import { PagoRepository } from '@/src/infrastructure/database/repositories/PagoRepository';

export interface SaldoResult {
  totalPagado: number;
  cantidadPagos: number;
  agrupacionesPorMes?: Array<{
    mes: string;
    total: number;
    cantidad: number;
  }>;
}

export class GetSaldosByCuidadorUseCase {
  constructor(private pagoRepository: PagoRepository) {}

  async execute(cuidadorId: string, from?: Date, to?: Date, groupByMonth: boolean = false): Promise<SaldoResult> {
    const { total, count } = await this.pagoRepository.getTotalByCuidador(cuidadorId, from, to);

    let agrupacionesPorMes: SaldoResult['agrupacionesPorMes'] | undefined;
    if (groupByMonth) {
      const pagos = await this.pagoRepository.findByCuidadorId(cuidadorId, from, to);
      const grouped = new Map<string, { total: number; cantidad: number }>();

      pagos.forEach(pago => {
        const monthKey = `${pago.fecha.getFullYear()}-${String(pago.fecha.getMonth() + 1).padStart(2, '0')}`;
        const existing = grouped.get(monthKey) || { total: 0, cantidad: 0 };
        grouped.set(monthKey, {
          total: existing.total + pago.monto,
          cantidad: existing.cantidad + 1,
        });
      });

      agrupacionesPorMes = Array.from(grouped.entries()).map(([mes, data]) => ({
        mes,
        total: data.total,
        cantidad: data.cantidad,
      })).sort((a, b) => a.mes.localeCompare(b.mes));
    }

    return {
      totalPagado: total,
      cantidadPagos: count,
      agrupacionesPorMes,
    };
  }
}
