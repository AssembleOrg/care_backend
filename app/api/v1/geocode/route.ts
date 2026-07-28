import { NextRequest } from 'next/server';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';

/** Qué tan fino es el punto que devolvió el geocoder. */
export type PrecisionGeocode = 'ALTURA' | 'CALLE' | 'APROXIMADA';

export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
  precision: PrecisionGeocode;
  fuente: 'georef' | 'osm';
}

const GEOCODER_URL = process.env.GEOCODER_URL || 'https://nominatim.openstreetmap.org/search';
const GEOCODER_COUNTRY = process.env.GEOCODER_COUNTRY || 'ar';
const GEOCODER_CONTACT = process.env.GEOCODER_CONTACT || null;
/** Servicio de direcciones del Estado argentino (datos.gob.ar). Sin API key. */
const GEOREF_URL = process.env.GEOREF_URL || 'https://apis.datos.gob.ar/georef/api/direcciones';

/** Nominatim pide como máximo 1 request por segundo. */
const MIN_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** Dos puntos a menos de esto se consideran el mismo lugar. */
const DEDUPE_METROS = 30;

// Cache y throttle viven en memoria del proceso: alcanza para el uso del
// panel (una búsqueda cada tanto al cargar una persona asistida).
const cache = new Map<string, { results: GeocodeResult[]; at: number }>();
let lastCallAt = 0;

function normalize(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function throttleNominatim(): Promise<void> {
  const wait = lastCallAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

function metrosEntre(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  return 6_371_000 * Math.hypot(dLat, dLng * Math.cos(lat));
}

/**
 * Georef espera la calle con altura por un lado y la localidad por otro, así
 * que se parte la consulta por la primera coma: "Belgrano 1200, Quilmes".
 * Sin altura no tiene sentido llamarlo: su gracia es justamente interpolar el número.
 */
function partirDireccion(query: string): { calle: string; resto: string | null } | null {
  const [calle, ...rest] = query.split(',');
  if (!/\d/.test(calle)) return null;
  const resto = rest.join(',').trim();
  return { calle: calle.trim(), resto: resto || null };
}

const ES_CABA = /caba|capital federal|ciudad aut[oó]noma|c\.a\.b\.a/i;

interface GeorefDireccion {
  nomenclatura?: string;
  ubicacion?: { lat?: number; lon?: number };
}

async function pedirGeoref(params: Record<string, string>): Promise<GeocodeResult[]> {
  const url = new URL(GEOREF_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('max', '5');

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];

  const data = (await res.json()) as { direcciones?: GeorefDireccion[] };
  return (data.direcciones ?? [])
    .filter((d) => Number.isFinite(d.ubicacion?.lat) && Number.isFinite(d.ubicacion?.lon))
    .map((d) => ({
      label: d.nomenclatura ?? '',
      lat: d.ubicacion!.lat!,
      lng: d.ubicacion!.lon!,
      precision: 'ALTURA' as const,
      fuente: 'georef' as const,
    }));
}

/** Georef: direcciones argentinas con la altura interpolada sobre la cuadra. */
async function buscarGeoref(query: string): Promise<GeocodeResult[]> {
  const partes = partirDireccion(query);
  if (!partes) return [];

  const base = { direccion: partes.calle };

  try {
    // La misma calle existe en muchas localidades, así que si se escribió uuna
    // se respeta: primero como localidad, después como provincia. Si con eso no
    // aparece nada NO se busca en todo el país — devolver "Av. de Mayo 500,
    // Pergamino" a quien escribió CABA es peor que no devolver nada. Para ese
    // caso queda Nominatim, que al menos ubica la calle correcta.
    if (partes.resto) {
      const esCaba = ES_CABA.test(partes.resto);
      const acotado = await pedirGeoref(esCaba ? { ...base, provincia: '02' } : { ...base, localidad: partes.resto });
      if (acotado.length > 0 || esCaba) return acotado;

      return await pedirGeoref({ ...base, provincia: partes.resto });
    }
    return await pedirGeoref(base);
  } catch {
    return []; // Si Georef no responde, queda Nominatim.
  }
}

/**
 * Nominatim (OSM). Aporta lo que Georef no tiene: nombres de lugares, esquinas
 * y direcciones que el nomenclador oficial no normaliza. Su política exige
 * identificarse y limita a 1 req/s, de ahí el throttle.
 */
async function buscarNominatim(query: string): Promise<GeocodeResult[]> {
  const url = new URL(GEOCODER_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '1');
  if (GEOCODER_COUNTRY) url.searchParams.set('countrycodes', GEOCODER_COUNTRY);
  if (GEOCODER_CONTACT) url.searchParams.set('email', GEOCODER_CONTACT);

  await throttleNominatim();

  const res = await fetch(url, {
    headers: {
      'User-Agent': `CareByDani/1.0 (${GEOCODER_CONTACT ?? 'sin contacto'})`,
      'Accept-Language': 'es',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Nominatim respondió ${res.status}`);

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];

  return data
    .map((r) => r as Record<string, unknown>)
    .filter((r) => typeof r.lat === 'string' && typeof r.lon === 'string')
    .map((r) => {
      const address = (r.address ?? {}) as Record<string, unknown>;
      // Sin house_number el punto es el centro de la calle entera: la altura
      // escrita no se respetó y hay que avisarlo.
      const precision: PrecisionGeocode = address.house_number
        ? 'ALTURA'
        : r.addresstype === 'road'
          ? 'CALLE'
          : 'APROXIMADA';
      return {
        label: String(r.display_name ?? ''),
        lat: Number(r.lat),
        lng: Number(r.lon),
        precision,
        fuente: 'osm' as const,
      };
    })
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
}

const ORDEN: Record<PrecisionGeocode, number> = { ALTURA: 0, CALLE: 1, APROXIMADA: 2 };

/** Junta ambas fuentes: primero los que respetan la altura, sin repetir puntos. */
function combinar(georef: GeocodeResult[], osm: GeocodeResult[]): GeocodeResult[] {
  const todos = [...georef, ...osm].sort((a, b) => ORDEN[a.precision] - ORDEN[b.precision]);
  const salida: GeocodeResult[] = [];
  for (const r of todos) {
    if (salida.some((s) => metrosEntre(s, r) < DEDUPE_METROS)) continue;
    salida.push(r);
  }
  return salida.slice(0, 6);
}

async function handleGET(request: NextRequest) {
  const requestId = getRequestId(request);
  const q = normalize(request.nextUrl.searchParams.get('q') || '');

  if (q.length < 3) {
    return createErrorResponse('VALIDATION_ERROR', 'Escribí una dirección para buscar', undefined, requestId);
  }

  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return createSuccessResponse(hit.results, requestId);
  }

  // En paralelo: si una fuente falla, la otra igual sirve.
  const [georef, osm] = await Promise.allSettled([buscarGeoref(q), buscarNominatim(q)]);

  if (georef.status === 'rejected' && osm.status === 'rejected') {
    return createErrorResponse(
      'UPSTREAM_ERROR',
      'No pudimos buscar la dirección. Revisá la conexión o marcá el punto a mano en el mapa.',
      undefined,
      requestId,
      502
    );
  }

  const results = combinar(
    georef.status === 'fulfilled' ? georef.value : [],
    osm.status === 'fulfilled' ? osm.value : []
  );

  cache.set(q, { results, at: Date.now() });
  return createSuccessResponse(results, requestId);
}

export const GET = requireAuth(handleGET);
