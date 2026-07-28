/**
 * Todo lo que se muestra o se compara por "día" es en hora de Argentina,
 * aunque el servidor corra en UTC.
 */
export const TZ_ARGENTINA = 'America/Argentina/Buenos_Aires';

const DIAS_ISO = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/** Fecha local en formato YYYY-MM-DD. */
export function fechaLocal(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_ARGENTINA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Día de la semana local con la convención del sistema: 0 = lunes … 6 = domingo. */
export function diaSemanaLocal(date: Date = new Date()): number {
  const nombre = new Intl.DateTimeFormat('en-US', { timeZone: TZ_ARGENTINA, weekday: 'long' })
    .format(date)
    .toLowerCase();
  return DIAS_ISO.indexOf(nombre);
}

/** Hora local en formato HH:mm. */
export function horaLocal(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ_ARGENTINA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** Horas trabajadas entre dos marcas, redondeadas a 2 decimales. */
export function horasEntre(desde: Date, hasta: Date): number {
  return Math.round(((hasta.getTime() - desde.getTime()) / 3_600_000) * 100) / 100;
}
