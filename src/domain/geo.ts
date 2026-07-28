export interface GeoPoint {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Distancia en metros entre dos puntos (fórmula del haversine). */
export function haversineMetros(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export interface ChequeoRango {
  distanciaMetros: number;
  enRango: boolean;
}

/**
 * Evalúa un fichaje contra el domicilio de la persona asistida.
 *
 * El GPS de un celular rara vez es exacto: adentro de una casa el error puede
 * ser de decenas de metros. Por eso se descuenta la precisión que informa el
 * navegador antes de comparar contra el radio; si aun así queda afuera, el
 * fichaje se registra igual y queda pendiente de aprobación (límite blando).
 */
export function chequearRango(
  destino: GeoPoint,
  marca: GeoPoint,
  radioMetros: number,
  precisionMetros?: number | null
): ChequeoRango {
  const distanciaMetros = haversineMetros(destino, marca);
  // La precisión que se descuenta se topea para que un `accuracy` absurdo
  // (típico de geolocalización por IP: miles de metros) no valide cualquier cosa.
  const margen = Math.min(Math.max(precisionMetros ?? 0, 0), 100);
  return {
    distanciaMetros,
    enRango: distanciaMetros - margen <= radioMetros,
  };
}
