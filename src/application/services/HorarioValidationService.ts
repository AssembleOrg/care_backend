/**
 * Servicio para validar superposición de horarios
 */

export interface Horario {
  diaSemana: number; // 0 = lunes, 6 = domingo
  horaInicio: string; // "HH:MM"
  horaFin: string; // "HH:MM"
}

export class HorarioValidationService {
  /**
   * Convierte hora "HH:MM" a minutos desde medianoche
   */
  private static horaAMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Verifica si dos horarios se superponen en el mismo día
   */
  private static seSuperponenMismoDia(h1: Horario, h2: Horario): boolean {
    if (h1.diaSemana !== h2.diaSemana) return false;

    const inicio1 = this.horaAMinutos(h1.horaInicio);
    const fin1 = this.horaAMinutos(h1.horaFin);
    const inicio2 = this.horaAMinutos(h2.horaInicio);
    const fin2 = this.horaAMinutos(h2.horaFin);

    // Se superponen si: inicio1 < fin2 && fin1 > inicio2
    return inicio1 < fin2 && fin1 > inicio2;
  }

  /**
   * Valida que los horarios de una nueva asignación no se superpongan
   * con las asignaciones existentes del mismo cuidador
   */
  static validarSuperposicion(
    nuevosHorarios: Horario[],
    asignacionesExistentes: Array<{ horarios: Horario[] }>
  ): { valido: boolean; error?: string } {
    // Validar formato de horarios nuevos
    for (const horario of nuevosHorarios) {
      if (horario.diaSemana < 0 || horario.diaSemana > 6) {
        return { valido: false, error: 'Día de semana inválido (debe ser 0-6)' };
      }

      if (!/^\d{2}:\d{2}$/.test(horario.horaInicio) || !/^\d{2}:\d{2}$/.test(horario.horaFin)) {
        return { valido: false, error: 'Formato de hora inválido (debe ser HH:MM)' };
      }

      const inicio = this.horaAMinutos(horario.horaInicio);
      const fin = this.horaAMinutos(horario.horaFin);

      if (fin <= inicio) {
        return { valido: false, error: `Hora fin debe ser mayor que hora inicio para ${this.getDiaNombre(horario.diaSemana)}` };
      }
    }

    // Validar que no se superpongan entre sí
    for (let i = 0; i < nuevosHorarios.length; i++) {
      for (let j = i + 1; j < nuevosHorarios.length; j++) {
        if (this.seSuperponenMismoDia(nuevosHorarios[i], nuevosHorarios[j])) {
          return {
            valido: false,
            error: `Los horarios se superponen en ${this.getDiaNombre(nuevosHorarios[i].diaSemana)}`,
          };
        }
      }
    }

    // Validar que no se superpongan con asignaciones existentes
    for (const asignacion of asignacionesExistentes) {
      const horariosExistentes: Horario[] = Array.isArray(asignacion.horarios)
        ? asignacion.horarios
        : [];

      for (const horarioExistente of horariosExistentes) {
        for (const nuevoHorario of nuevosHorarios) {
          if (this.seSuperponenMismoDia(horarioExistente, nuevoHorario)) {
            return {
              valido: false,
              error: `El horario se superpone con una asignación existente en ${this.getDiaNombre(nuevoHorario.diaSemana)} (${horarioExistente.horaInicio} - ${horarioExistente.horaFin})`,
            };
          }
        }
      }
    }

    return { valido: true };
  }

  private static getDiaNombre(diaSemana: number): string {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return dias[diaSemana] || `Día ${diaSemana}`;
  }
}
