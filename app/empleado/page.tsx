'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Stack,
  Card,
  Text,
  Title,
  Button,
  Group,
  Badge,
  Alert,
  Loader,
  Divider,
  Radio,
  Modal,
} from '@mantine/core';
import dynamic from 'next/dynamic';
import { notifications } from '@mantine/notifications';
import { IconMapPin, IconLogin2, IconLogout2, IconAlertTriangle, IconClock, IconRefresh } from '@tabler/icons-react';
import { haversineMetros } from '@/src/domain/geo';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

// Leaflet toca `window` al importarse: sólo en el cliente.
const LeafletMap = dynamic(() => import('@/src/presentation/components/mapa/LeafletMap'), {
  ssr: false,
  loading: () => (
    <Group justify="center" style={{ height: 260 }}>
      <Loader />
    </Group>
  ),
});

interface Horario {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

interface Persona {
  id: string;
  nombreCompleto: string;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  radioMetros: number;
  horariosHoy: Horario[];
}

interface TurnoAbierto {
  id: string;
  personaId: string;
  personaNombre: string;
  lat: number | null;
  lng: number | null;
  radioMetros: number;
  entradaAt: string;
  entradaDistanciaM: number;
  entradaEnRango: boolean;
}

/** Lo que se muestra en el mapa antes de confirmar la marca. */
interface MarcaPendiente {
  tipo: 'entrada' | 'salida';
  personaId: string;
  personaNombre: string;
  destino: { lat: number; lng: number } | null;
  radioMetros: number;
  posicion: { lat: number; lng: number };
  precision: number | null;
  distancia: number | null;
}

interface FichajeCerrado {
  id: string;
  personaNombre: string;
  entradaAt: string;
  salidaAt: string;
  horas: number;
  revision: 'NO_REQUIERE' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}

interface Jornada {
  personas: Persona[];
  turnoAbierto: TurnoAbierto | null;
  ultimos: FichajeCerrado[];
}

/** Pide la ubicación al navegador con la mejor precisión disponible. */
function obtenerUbicacion(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Tu teléfono o navegador no permite compartir la ubicación.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      const mensajes: Record<number, string> = {
        1: 'Tenés que permitir el acceso a la ubicación para poder fichar.',
        2: 'No se pudo obtener la ubicación. Salí al aire libre y probá de nuevo.',
        3: 'La ubicación tardó demasiado. Probá de nuevo.',
      };
      reject(new Error(mensajes[err.code] || 'No se pudo obtener la ubicación.'));
    }, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });
  });
}

const ETIQUETA_REVISION: Record<FichajeCerrado['revision'], { label: string; color: string } | null> = {
  NO_REQUIERE: null,
  PENDIENTE: { label: 'A revisar', color: 'yellow' },
  APROBADO: { label: 'Aprobado', color: 'green' },
  RECHAZADO: { label: 'Rechazado', color: 'red' },
};

export default function EmpleadoPage() {
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [loading, setLoading] = useState(true);
  const [marcando, setMarcando] = useState(false);
  const [ubicando, setUbicando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [personaId, setPersonaId] = useState<string>('');
  const [marca, setMarca] = useState<MarcaPendiente | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/fichajes/mi-jornada');
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error?.message || 'No se pudo cargar tu jornada');
      setJornada(data.data);
      setErrorCarga(null);
      if (data.data.personas.length === 1) setPersonaId(data.data.personas[0].id);
    } catch (error: unknown) {
      setErrorCarga(error instanceof Error ? error.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Toma la ubicación y la muestra en el mapa: recién ahí se confirma. */
  const prepararMarca = async (tipo: 'entrada' | 'salida') => {
    if (tipo === 'entrada' && !personaId) {
      notifications.show({ title: 'Falta elegir', message: 'Elegí a quién vas a cuidar', color: 'red' });
      return;
    }

    setUbicando(true);
    try {
      const pos = await obtenerUbicacion();
      const posicion = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const precision = Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null;

      const turno = jornada?.turnoAbierto ?? null;
      const persona = jornada?.personas.find((p) => p.id === personaId) ?? null;

      const destino =
        tipo === 'salida'
          ? turno?.lat != null && turno.lng != null
            ? { lat: turno.lat, lng: turno.lng }
            : null
          : persona?.lat != null && persona.lng != null
            ? { lat: persona.lat, lng: persona.lng }
            : null;

      setMarca({
        tipo,
        personaId: tipo === 'salida' ? (turno?.personaId ?? '') : personaId,
        personaNombre: tipo === 'salida' ? (turno?.personaNombre ?? '') : (persona?.nombreCompleto ?? ''),
        destino,
        radioMetros: tipo === 'salida' ? (turno?.radioMetros ?? 50) : (persona?.radioMetros ?? 50),
        posicion,
        precision,
        // Referencia para el empleado; la distancia que vale la calcula el servidor.
        distancia: destino ? Math.round(haversineMetros(destino, posicion)) : null,
      });
    } catch (error: unknown) {
      notifications.show({
        title: 'Sin ubicación',
        message: error instanceof Error ? error.message : 'No se pudo obtener la ubicación',
        color: 'red',
        autoClose: 8000,
      });
    } finally {
      setUbicando(false);
    }
  };

  const confirmarMarca = async () => {
    if (!marca) return;
    const tipo = marca.tipo;

    setMarcando(true);
    try {
      const cuerpo = {
        lat: marca.posicion.lat,
        lng: marca.posicion.lng,
        precision: marca.precision,
        ...(tipo === 'entrada' ? { personaId: marca.personaId } : {}),
      };

      const url = tipo === 'entrada' ? '/api/v1/fichajes' : '/api/v1/fichajes/salida';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error?.message || 'No se pudo registrar la marca');

      const enRango = data.data.enRango;
      notifications.show({
        title: tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada',
        message: enRango
          ? `Estás a ${data.data.distanciaMetros} m del domicilio.`
          : `Quedaste a ${data.data.distanciaMetros} m del domicilio: se registró igual y la administración lo va a revisar.`,
        color: enRango ? 'green' : 'yellow',
        autoClose: 8000,
      });

      setMarca(null);
      cargar();
    } catch (error: unknown) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo registrar la marca',
        color: 'red',
        autoClose: 8000,
      });
    } finally {
      setMarcando(false);
    }
  };

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  if (errorCarga) {
    return (
      <Alert color="red" icon={<IconAlertTriangle size={18} />} title="No se pudo cargar">
        {errorCarga}
      </Alert>
    );
  }

  const turno = jornada?.turnoAbierto ?? null;
  const personas = jornada?.personas ?? [];

  return (
    <Stack gap="md">
      <Title order={2}>Mi jornada</Title>

      {turno ? (
        <Card withBorder radius="md" padding="lg">
          <Stack gap="sm">
            <Group justify="space-between">
              <Badge color="green" size="lg" variant="light">
                Turno abierto
              </Badge>
              <Text size="sm" c="dimmed">
                {dayjs(turno.entradaAt).format('DD/MM/YYYY HH:mm')}
              </Text>
            </Group>
            <Text fw={600} size="lg">
              {turno.personaNombre}
            </Text>
            <Text size="sm" c="dimmed">
              Entrada marcada a {turno.entradaDistanciaM} m del domicilio
              {turno.entradaEnRango ? '' : ' (fuera del radio, pendiente de revisión)'}.
            </Text>
            <Button
              size="lg"
              color="red"
              leftSection={<IconLogout2 size={20} />}
              loading={ubicando}
              onClick={() => prepararMarca('salida')}
            >
              Marcar salida
            </Button>
          </Stack>
        </Card>
      ) : (
        <Card withBorder radius="md" padding="lg">
          <Stack gap="sm">
            <Text fw={600}>¿A quién vas a cuidar?</Text>

            {personas.length === 0 ? (
              <Alert color="yellow" icon={<IconAlertTriangle size={18} />}>
                No tenés personas asignadas todavía. Hablá con la administración.
              </Alert>
            ) : (
              <Radio.Group value={personaId} onChange={setPersonaId}>
                <Stack gap="xs">
                  {personas.map((p) => (
                    <Card key={p.id} withBorder padding="sm" radius="sm">
                      <Radio
                        value={p.id}
                        label={
                          <div>
                            <Text fw={600}>{p.nombreCompleto}</Text>
                            {p.direccion && (
                              <Text size="xs" c="dimmed">
                                <IconMapPin size={12} style={{ verticalAlign: -2 }} /> {p.direccion}
                              </Text>
                            )}
                            {p.horariosHoy.length > 0 && (
                              <Text size="xs" c="cyan">
                                Hoy: {p.horariosHoy.map((h) => `${h.horaInicio}-${h.horaFin}`).join(', ')}
                              </Text>
                            )}
                            {p.lat == null && (
                              <Text size="xs" c="red">
                                Sin ubicación cargada: no vas a poder fichar acá.
                              </Text>
                            )}
                          </div>
                        }
                      />
                    </Card>
                  ))}
                </Stack>
              </Radio.Group>
            )}

            <Button
              size="lg"
              leftSection={<IconLogin2 size={20} />}
              loading={ubicando}
              disabled={personas.length === 0}
              onClick={() => prepararMarca('entrada')}
            >
              Marcar entrada
            </Button>
            <Text size="xs" c="dimmed" ta="center">
              Al marcar se registra tu ubicación en ese momento. No se te sigue en ningún otro momento.
            </Text>
          </Stack>
        </Card>
      )}

      {(jornada?.ultimos.length ?? 0) > 0 && (
        <>
          <Divider label="Últimos turnos" labelPosition="center" />
          <Stack gap="xs">
            {jornada!.ultimos.map((f) => {
              const etiqueta = ETIQUETA_REVISION[f.revision];
              return (
                <Card key={f.id} withBorder padding="sm" radius="sm">
                  <Group justify="space-between" wrap="nowrap">
                    <div style={{ minWidth: 0 }}>
                      <Text size="sm" fw={600} truncate>
                        {f.personaNombre}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {dayjs(f.entradaAt).format('DD/MM/YYYY HH:mm')} → {dayjs(f.salidaAt).format('HH:mm')}
                      </Text>
                    </div>
                    <Group gap="xs" wrap="nowrap">
                      {etiqueta && (
                        <Badge color={etiqueta.color} variant="light" size="sm">
                          {etiqueta.label}
                        </Badge>
                      )}
                      <Badge variant="light" size="sm" leftSection={<IconClock size={12} />}>
                        {f.horas} h
                      </Badge>
                    </Group>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        </>
      )}

      {/* Confirmación: se ve dónde estás antes de que quede registrado. */}
      <Modal
        opened={!!marca}
        onClose={() => setMarca(null)}
        title={marca?.tipo === 'salida' ? 'Confirmar salida' : 'Confirmar entrada'}
        centered
        fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
      >
        {marca && (
          <Stack gap="sm">
            <Text fw={600}>{marca.personaNombre}</Text>

            {marca.destino ? (
              <>
                <LeafletMap
                  center={marca.posicion}
                  zoom={17}
                  pin={marca.destino}
                  pinArrastrable={false}
                  radioMetros={marca.radioMetros}
                  posicionActual={marca.posicion}
                  precisionMetros={marca.precision}
                  style={{ height: 260 }}
                />
                <Group gap="xs" justify="center">
                  <Badge color="pink" variant="light" size="sm">
                    Domicilio
                  </Badge>
                  <Badge color="blue" variant="light" size="sm">
                    Vos
                  </Badge>
                </Group>
              </>
            ) : (
              <Alert color="yellow" icon={<IconAlertTriangle size={16} />} py="xs">
                Ese domicilio no tiene ubicación cargada, así que no se puede mostrar el mapa.
              </Alert>
            )}

            {marca.distancia != null && (
              <Alert
                color={marca.distancia <= marca.radioMetros ? 'green' : 'yellow'}
                icon={<IconMapPin size={16} />}
                py="xs"
              >
                {marca.distancia <= marca.radioMetros
                  ? `Estás a ${marca.distancia} m del domicilio, dentro de los ${marca.radioMetros} m permitidos.`
                  : `Estás a ${marca.distancia} m del domicilio, más de los ${marca.radioMetros} m permitidos. Podés fichar igual: queda registrado y la administración lo revisa.`}
                {marca.precision != null && ` Precisión del GPS: ±${Math.round(marca.precision)} m.`}
              </Alert>
            )}

            <Button
              size="lg"
              color={marca.tipo === 'salida' ? 'red' : undefined}
              leftSection={marca.tipo === 'salida' ? <IconLogout2 size={20} /> : <IconLogin2 size={20} />}
              loading={marcando}
              onClick={confirmarMarca}
            >
              {marca.tipo === 'salida' ? 'Confirmar salida' : 'Confirmar entrada'}
            </Button>
            <Group grow>
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                loading={ubicando}
                onClick={() => prepararMarca(marca.tipo)}
              >
                Actualizar ubicación
              </Button>
              <Button variant="subtle" color="gray" onClick={() => setMarca(null)} disabled={marcando}>
                Cancelar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
