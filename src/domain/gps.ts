/**
 * Heurísticas para distinguir una lectura de GPS de una ubicación estimada por
 * red (WiFi o IP).
 *
 * Vienen de un caso real: un fichaje quedó a 9,5 km del domicilio con el
 * navegador informando ±1 m de precisión. Las coordenadas tenían cuatro
 * decimales exactos y el user agent era una PC de escritorio. O sea: el
 * `accuracy` que informa el navegador no se puede tomar como verdad, porque
 * los servicios de geolocalización por IP lo rellenan con cualquier valor.
 */

/** Cuántos decimales trae el número. Un GPS real devuelve seis o siete. */
function decimales(n: number): number {
  const texto = String(n);
  const punto = texto.indexOf('.');
  return punto === -1 ? 0 : texto.length - punto - 1;
}

export interface LecturaUbicacion {
  lat: number;
  lng: number;
  precisionM?: number | null;
  /** Sólo del lado del servidor; en el browser se usa `esDispositivoTactil`. */
  userAgent?: string | null;
}

export type MotivoDudoso = 'COORDENADAS_REDONDEADAS' | 'PRECISION_IMPOSIBLE' | 'SIN_GPS' | 'PRECISION_POBRE';

/** Ninguna de estas lecturas sirve para decidir si alguien está en un domicilio. */
const PRECISION_MINIMA_CREIBLE_M = 3;
const PRECISION_ACEPTABLE_M = 150;

const UA_MOVIL = /android|iphone|ipad|ipod|mobile|windows phone/i;

/** ¿El user agent es de un teléfono o tablet? */
export function esDispositivoMovil(userAgent: string | null | undefined): boolean {
  return !!userAgent && UA_MOVIL.test(userAgent);
}

/**
 * Devuelve los motivos por los que la lectura no parece un GPS de verdad.
 * Vacío = lectura creíble.
 */
export function motivosDeUbicacionDudosa(lectura: LecturaUbicacion): MotivoDudoso[] {
  const motivos: MotivoDudoso[] = [];

  // Una precisión de entre 3 y 150 m es la huella de un GPS de verdad.
  const precisionCreible =
    lectura.precisionM != null &&
    lectura.precisionM >= PRECISION_MINIMA_CREIBLE_M &&
    lectura.precisionM <= PRECISION_ACEPTABLE_M;

  // Los servicios por IP devuelven el centro de una zona, redondeado. No se
  // toma como señal cuando viene de un teléfono con una precisión creíble: ahí
  // el redondeo puede ser del propio dispositivo y marcarlo sería un falso
  // positivo.
  const redondeadas = decimales(lectura.lat) <= 4 && decimales(lectura.lng) <= 4;
  if (redondeadas && !(precisionCreible && esDispositivoMovil(lectura.userAgent))) {
    motivos.push('COORDENADAS_REDONDEADAS');
  }

  // Ningún GPS civil informa menos de unos pocos metros de error.
  if (lectura.precisionM != null && lectura.precisionM > 0 && lectura.precisionM < PRECISION_MINIMA_CREIBLE_M) {
    motivos.push('PRECISION_IMPOSIBLE');
  }

  if (lectura.precisionM != null && lectura.precisionM > PRECISION_ACEPTABLE_M) {
    motivos.push('PRECISION_POBRE');
  }

  // Una computadora no tiene GPS: resuelve por WiFi o por IP.
  if (lectura.userAgent != null && !esDispositivoMovil(lectura.userAgent)) {
    motivos.push('SIN_GPS');
  }

  return motivos;
}

export function esUbicacionDudosa(lectura: LecturaUbicacion): boolean {
  return motivosDeUbicacionDudosa(lectura).length > 0;
}

export const TEXTO_MOTIVO: Record<MotivoDudoso, string> = {
  COORDENADAS_REDONDEADAS: 'las coordenadas vienen redondeadas, típico de una ubicación estimada por internet',
  PRECISION_IMPOSIBLE: 'el navegador informó una precisión imposible para un GPS',
  PRECISION_POBRE: 'el margen de error es demasiado grande',
  SIN_GPS: 'se fichó desde una computadora, que no tiene GPS',
};
