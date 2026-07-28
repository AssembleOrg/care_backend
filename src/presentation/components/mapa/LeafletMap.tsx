'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoPoint } from '@/src/domain/geo';

interface LeafletMapProps {
  center: GeoPoint;
  zoom?: number;
  /** Pin principal; arrastrable salvo que se indique lo contrario. */
  pin?: GeoPoint | null;
  onPinMove?: (point: GeoPoint) => void;
  pinArrastrable?: boolean;
  /** Radio tolerado en metros, dibujado a escala real alrededor del pin. */
  radioMetros?: number | null;
  /** Segundo punto fijo: la posición del que está fichando. */
  posicionActual?: GeoPoint | null;
  /** Precisión del GPS en metros, dibujada alrededor de la posición actual. */
  precisionMetros?: number | null;
  className?: string;
  style?: React.CSSProperties;
}

/** Pin propio: evita depender de los assets por defecto de Leaflet. */
const pinIcon = L.divIcon({
  className: '',
  html: `<span style="display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#e5006d;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

/** Punto azul de "estás acá", al estilo de las apps de mapas. */
const posicionIcon = L.divIcon({
  className: '',
  html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:#1c7ed6;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4)"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
/**
 * Capa base oficial del Instituto Geográfico Nacional. Se usa en los zooms
 * alejados porque OSM rotula las Malvinas como "Falkland Islands": en una
 * aplicación argentina eso no puede aparecer. El IGN las rotula
 * "Islas Malvinas (Arg.)" y es cartografía oficial del Estado.
 */
const IGN_URL = 'https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG:3857@png/{z}/{x}/{y}.png';
/**
 * Desde este zoom se usa OSM: el IGN deja de rotular calles y alturas, que es
 * justo lo que hace falta para ubicar una puerta. Por debajo, el rótulo de las
 * islas ya es visible, así que manda el IGN.
 */
const ZOOM_MINIMO_OSM = 13;

/**
 * Mapa Leaflet con dos capas base según el zoom (ver IGN_URL).
 *
 * Los tiles públicos de OSM son para volumen bajo; si el tráfico crece hay que
 * pasar a un proveedor de tiles con su propia key.
 */
export default function LeafletMap({
  center,
  zoom = 16,
  pin,
  onPinMove,
  pinArrastrable = true,
  radioMetros,
  posicionActual,
  precisionMetros,
  className,
  style,
}: LeafletMapProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const posicionRef = useRef<L.Marker | null>(null);
  const precisionRef = useRef<L.Circle | null>(null);
  // El callback vive en un ref para que los handlers (registrados una sola vez)
  // siempre llamen a la última versión, sin recrear el mapa.
  const onPinMoveRef = useRef(onPinMove);
  useEffect(() => {
    onPinMoveRef.current = onPinMove;
  }, [onPinMove]);

  // Init (una sola vez).
  useEffect(() => {
    if (!nodeRef.current || mapRef.current) return;
    const map = L.map(nodeRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: false,
    });
    const osm = L.tileLayer(OSM_URL, {
      attribution: '© OpenStreetMap · Leaflet',
      maxZoom: 19,
    });
    const ign = L.tileLayer(IGN_URL, {
      attribution: 'Instituto Geográfico Nacional de la República Argentina',
      tms: true, // el IGN sirve TMS: el eje Y va al revés que en XYZ
      maxZoom: 20,
    });

    // Se alterna la capa base según el zoom, nunca las dos a la vez.
    const aplicarCapaBase = () => {
      const usarOsm = map.getZoom() >= ZOOM_MINIMO_OSM;
      const entra = usarOsm ? osm : ign;
      const sale = usarOsm ? ign : osm;
      if (!map.hasLayer(entra)) entra.addTo(map);
      if (map.hasLayer(sale)) map.removeLayer(sale);
    };
    aplicarCapaBase();
    map.on('zoomend', aplicarCapaBase);

    L.control.zoom({ position: 'topright' }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      onPinMoveRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      pinRef.current = null;
      circleRef.current = null;
      posicionRef.current = null;
      precisionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pin arrastrable + círculo del radio.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!pin) {
      pinRef.current?.remove();
      pinRef.current = null;
      circleRef.current?.remove();
      circleRef.current = null;
      return;
    }

    if (!pinRef.current) {
      const marker = L.marker([pin.lat, pin.lng], { icon: pinIcon, draggable: pinArrastrable }).addTo(map);
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        onPinMoveRef.current?.({ lat, lng });
      });
      pinRef.current = marker;
    } else {
      pinRef.current.setLatLng([pin.lat, pin.lng]);
    }

    if (radioMetros && radioMetros > 0) {
      if (!circleRef.current) {
        circleRef.current = L.circle([pin.lat, pin.lng], {
          radius: radioMetros,
          color: '#e5006d',
          weight: 2,
          fillColor: '#e5006d',
          fillOpacity: 0.1,
        }).addTo(map);
      } else {
        circleRef.current.setLatLng([pin.lat, pin.lng]);
        circleRef.current.setRadius(radioMetros);
      }
    } else {
      circleRef.current?.remove();
      circleRef.current = null;
    }
  }, [pin, radioMetros, pinArrastrable]);

  // Posición del que está fichando, con su círculo de precisión.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!posicionActual) {
      posicionRef.current?.remove();
      posicionRef.current = null;
      precisionRef.current?.remove();
      precisionRef.current = null;
      return;
    }

    const punto: L.LatLngExpression = [posicionActual.lat, posicionActual.lng];

    if (!posicionRef.current) {
      posicionRef.current = L.marker(punto, { icon: posicionIcon, interactive: false, zIndexOffset: 500 }).addTo(map);
    } else {
      posicionRef.current.setLatLng(punto);
    }

    if (precisionMetros && precisionMetros > 0) {
      if (!precisionRef.current) {
        precisionRef.current = L.circle(punto, {
          radius: precisionMetros,
          color: '#1c7ed6',
          weight: 1,
          fillColor: '#1c7ed6',
          fillOpacity: 0.12,
          interactive: false,
        }).addTo(map);
      } else {
        precisionRef.current.setLatLng(punto);
        precisionRef.current.setRadius(precisionMetros);
      }
    } else {
      precisionRef.current?.remove();
      precisionRef.current = null;
    }
  }, [posicionActual, precisionMetros]);

  // Recentrar cuando cambia el centro.
  useEffect(() => {
    mapRef.current?.setView([center.lat, center.lng], mapRef.current.getZoom());
  }, [center.lat, center.lng]);

  return <div ref={nodeRef} className={className} style={{ height: 320, borderRadius: 8, ...style }} />;
}
