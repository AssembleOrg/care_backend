import { NextRequest } from 'next/server';
import { requireAuth } from '@/src/presentation/middleware/auth';
import { createSuccessResponse, createErrorResponse, getRequestId } from '@/src/presentation/middleware/responseWrapper';

export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

const GEOCODER_URL = process.env.GEOCODER_URL || 'https://nominatim.openstreetmap.org/search';
const GEOCODER_COUNTRY = process.env.GEOCODER_COUNTRY || 'ar';
const GEOCODER_CONTACT = process.env.GEOCODER_CONTACT || null;

/** Nominatim pide como máximo 1 request por segundo. */
const MIN_INTERVAL_MS = 1100;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Cache y throttle viven en memoria del proceso: alcanza para el uso del
// panel (una búsqueda cada tanto al cargar una persona asistida).
const cache = new Map<string, { results: GeocodeResult[]; at: number }>();
let lastCallAt = 0;

function normalize(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function throttle(): Promise<void> {
  const wait = lastCallAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

/**
 * Geocoding contra Nominatim (OSM), siempre desde el servidor: su política
 * exige identificarse, limita a 1 req/s y desaconseja usarlo para autocompletar
 * mientras se tipea. Por eso se dispara sólo con el botón "Buscar".
 */
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

  const url = new URL(GEOCODER_URL);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '0');
  if (GEOCODER_COUNTRY) url.searchParams.set('countrycodes', GEOCODER_COUNTRY);
  if (GEOCODER_CONTACT) url.searchParams.set('email', GEOCODER_CONTACT);

  try {
    await throttle();

    const res = await fetch(url, {
      headers: {
        'User-Agent': `CareByDani/1.0 (${GEOCODER_CONTACT ?? 'sin contacto'})`,
        'Accept-Language': 'es',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return createErrorResponse(
        'UPSTREAM_ERROR',
        'El buscador de direcciones no respondió. Probá de nuevo en un momento.',
        undefined,
        requestId,
        502
      );
    }

    const data = (await res.json()) as unknown;
    const results: GeocodeResult[] = Array.isArray(data)
      ? data
          .map((r) => r as Record<string, unknown>)
          .filter((r) => typeof r.lat === 'string' && typeof r.lon === 'string')
          .map((r) => ({
            label: String(r.display_name ?? ''),
            lat: Number(r.lat),
            lng: Number(r.lon),
          }))
          .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
      : [];

    cache.set(q, { results, at: Date.now() });
    return createSuccessResponse(results, requestId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse(
      'UPSTREAM_ERROR',
      'No pudimos buscar la dirección. Revisá la conexión o marcá el punto a mano en el mapa.',
      message,
      requestId,
      502
    );
  }
}

export const GET = requireAuth(handleGET);
