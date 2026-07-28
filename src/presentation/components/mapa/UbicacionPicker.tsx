'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Stack, Group, TextInput, Button, NumberInput, Text, Alert, Loader, ScrollArea, UnstyledButton, Paper, Badge } from '@mantine/core';
import { IconMapPin, IconSearch, IconInfoCircle } from '@tabler/icons-react';
import type { GeoPoint } from '@/src/domain/geo';

// Leaflet toca `window` al importarse: sólo en el cliente.
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <Group justify="center" style={{ height: 320 }}>
      <Loader />
    </Group>
  ),
});

/** Centro por defecto del mapa cuando la persona todavía no tiene punto (CABA). */
const CENTRO_DEFAULT: GeoPoint = { lat: -34.6037, lng: -58.3816 };

type PrecisionGeocode = 'ALTURA' | 'CALLE' | 'APROXIMADA';

interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
  precision: PrecisionGeocode;
  fuente: 'georef' | 'osm';
}

/** El geocoder no siempre ubica la altura: hay que decirlo, no disimularlo. */
const ETIQUETA_PRECISION: Record<PrecisionGeocode, { texto: string; color: string }> = {
  ALTURA: { texto: 'altura exacta', color: 'teal' },
  CALLE: { texto: 'sólo la calle', color: 'yellow' },
  APROXIMADA: { texto: 'aproximada', color: 'orange' },
};

interface UbicacionPickerProps {
  lat: number | null;
  lng: number | null;
  radioMetros: number;
  /** Dirección ya cargada en el formulario: se usa como búsqueda inicial. */
  direccion?: string;
  onChange: (value: { lat: number | null; lng: number | null; radioMetros: number }) => void;
}

export function UbicacionPicker({ lat, lng, radioMetros, direccion, onChange }: UbicacionPickerProps) {
  const [busqueda, setBusqueda] = useState(direccion ?? '');
  const [resultados, setResultados] = useState<GeocodeResult[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elegido, setElegido] = useState<GeocodeResult | null>(null);

  const pin = useMemo<GeoPoint | null>(
    () => (lat != null && lng != null ? { lat, lng } : null),
    [lat, lng]
  );
  const centro = pin ?? CENTRO_DEFAULT;

  const buscar = async () => {
    if (busqueda.trim().length < 3) {
      setError('Escribí una dirección para buscar.');
      return;
    }
    setBuscando(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/geocode?q=${encodeURIComponent(busqueda)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error?.message || 'No se pudo buscar la dirección');
      setResultados(data.data);
      if (data.data.length === 0) {
        setElegido(null);
        setError('Sin resultados. Marcá el punto a mano en el mapa.');
        return;
      }
      // El primero es el más preciso: el backend los ordena por precisión.
      const primero = data.data[0];
      setElegido(primero);
      onChange({ lat: primero.lat, lng: primero.lng, radioMetros });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al buscar la dirección');
    } finally {
      setBuscando(false);
    }
  };

  return (
    <Stack gap="sm">
      <Group align="flex-end" gap="xs" wrap="nowrap">
        <TextInput
          label="Buscar dirección"
          placeholder="Calle 1234, Ciudad"
          value={busqueda}
          onChange={(e) => setBusqueda(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              buscar();
            }
          }}
          style={{ flex: 1 }}
        />
        <Button onClick={buscar} loading={buscando} leftSection={<IconSearch size={16} />}>
          Buscar
        </Button>
      </Group>

      {error && (
        <Alert color="yellow" icon={<IconInfoCircle size={16} />} py="xs">
          {error}
        </Alert>
      )}

      {resultados.length > 0 && (
        <Paper withBorder p="xs">
          <Text size="xs" c="dimmed" mb={4}>
            Resultados: elegí el correcto y después ajustá el pin si hace falta.
          </Text>
          <ScrollArea.Autosize mah={150}>
            <Stack gap={4}>
              {resultados.map((r, i) => {
                const etiqueta = ETIQUETA_PRECISION[r.precision];
                const activo = elegido?.lat === r.lat && elegido?.lng === r.lng;
                return (
                  <UnstyledButton
                    key={`${r.lat}-${r.lng}-${i}`}
                    onClick={() => {
                      setElegido(r);
                      onChange({ lat: r.lat, lng: r.lng, radioMetros });
                    }}
                    style={{
                      fontSize: 13,
                      padding: '4px 6px',
                      borderRadius: 4,
                      fontWeight: activo ? 600 : 400,
                    }}
                  >
                    <Group gap={6} wrap="nowrap" align="flex-start">
                      <Badge size="xs" variant="light" color={etiqueta.color} style={{ flexShrink: 0 }}>
                        {etiqueta.texto}
                      </Badge>
                      <span>{r.label}</span>
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </ScrollArea.Autosize>
        </Paper>
      )}

      {elegido && elegido.precision !== 'ALTURA' && (
        <Alert color="yellow" icon={<IconInfoCircle size={16} />} py="xs">
          Este resultado no tiene la altura cargada: el punto cayó sobre la calle, no sobre la casa. Arrastrá el pin
          hasta la puerta antes de guardar.
        </Alert>
      )}

      <LeafletMap
        center={centro}
        pin={pin}
        radioMetros={radioMetros}
        onPinMove={(p) => onChange({ lat: p.lat, lng: p.lng, radioMetros })}
      />

      <Group justify="space-between" align="flex-end">
        <div>
          <Text size="sm" fw={500}>
            <IconMapPin size={14} style={{ verticalAlign: -2 }} />{' '}
            {pin ? `${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}` : 'Sin ubicación cargada'}
          </Text>
          <Text size="xs" c="dimmed">
            Clickeá el mapa o arrastrá el pin para ajustar el punto exacto.
          </Text>
        </div>
        <NumberInput
          label="Radio permitido"
          description="Metros"
          min={20}
          max={1000}
          step={10}
          w={160}
          value={radioMetros}
          onChange={(v) => onChange({ lat, lng, radioMetros: Number(v) || 50 })}
        />
      </Group>

      {pin && (
        <Button variant="subtle" color="red" size="xs" onClick={() => onChange({ lat: null, lng: null, radioMetros })}>
          Quitar ubicación
        </Button>
      )}
    </Stack>
  );
}
