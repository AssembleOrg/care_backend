'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoPoint } from '@/src/domain/geo';

interface LeafletMapProps {
  center: GeoPoint;
  zoom?: number;
  /** Pin arrastrable; devuelve la posición al soltarlo o al clickear el mapa. */
  pin?: GeoPoint | null;
  onPinMove?: (point: GeoPoint) => void;
  /** Radio tolerado en metros, dibujado a escala real alrededor del pin. */
  radioMetros?: number | null;
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

/**
 * Mapa Leaflet + tiles de OpenStreetMap.
 *
 * Los tiles públicos de OSM son para volumen bajo; si el tráfico crece hay que
 * pasar a un proveedor de tiles con su propia key.
 */
export default function LeafletMap({
  center,
  zoom = 16,
  pin,
  onPinMove,
  radioMetros,
  className,
  style,
}: LeafletMapProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap · Leaflet',
      maxZoom: 19,
    }).addTo(map);
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
      const marker = L.marker([pin.lat, pin.lng], { icon: pinIcon, draggable: true }).addTo(map);
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
  }, [pin, radioMetros]);

  // Recentrar cuando cambia el centro.
  useEffect(() => {
    mapRef.current?.setView([center.lat, center.lng], mapRef.current.getZoom());
  }, [center.lat, center.lng]);

  return <div ref={nodeRef} className={className} style={{ height: 320, borderRadius: 8, ...style }} />;
}
