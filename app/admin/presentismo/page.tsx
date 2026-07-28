'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Title,
  Paper,
  Group,
  Select,
  Table,
  Badge,
  Text,
  Loader,
  Button,
  Anchor,
  Modal,
  Stack,
  Textarea,
  SimpleGrid,
  Card,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconMapPin, IconRefresh } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { parseApiError } from '../utils/parseApiError';

interface Fichaje {
  id: string;
  cuidadorId: string;
  cuidadorNombre: string;
  personaId: string;
  personaNombre: string;
  entradaAt: string;
  entradaDistanciaM: number;
  entradaEnRango: boolean;
  entradaLat: number;
  entradaLng: number;
  salidaAt: string | null;
  salidaDistanciaM: number | null;
  salidaEnRango: boolean | null;
  horas: number | null;
  revision: 'NO_REQUIERE' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  notaRevision: string | null;
}

interface Cuidador {
  id: string;
  nombreCompleto: string;
}

const REVISIONES = [
  { value: 'PENDIENTE', label: 'A revisar' },
  { value: 'NO_REQUIERE', label: 'En rango' },
  { value: 'APROBADO', label: 'Aprobados' },
  { value: 'RECHAZADO', label: 'Rechazados' },
];

const BADGE_REVISION: Record<Fichaje['revision'], { label: string; color: string }> = {
  NO_REQUIERE: { label: 'En rango', color: 'green' },
  PENDIENTE: { label: 'A revisar', color: 'yellow' },
  APROBADO: { label: 'Aprobado', color: 'blue' },
  RECHAZADO: { label: 'Rechazado', color: 'red' },
};

export default function PresentismoPage() {
  const [fichajes, setFichajes] = useState<Fichaje[]>([]);
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [cuidadorId, setCuidadorId] = useState<string | null>(null);
  const [revision, setRevision] = useState<string | null>(null);
  const [desde, setDesde] = useState<Date | null>(dayjs().subtract(14, 'day').toDate());
  const [hasta, setHasta] = useState<Date | null>(new Date());

  const [rechazando, setRechazando] = useState<Fichaje | null>(null);
  const [nota, setNota] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cuidadorId) params.set('cuidadorId', cuidadorId);
      if (revision) params.set('revision', revision);
      if (desde) params.set('desde', dayjs(desde).startOf('day').toISOString());
      if (hasta) params.set('hasta', dayjs(hasta).endOf('day').toISOString());

      const res = await fetch(`/api/v1/fichajes?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error?.message || 'No se pudieron cargar los fichajes');
      setFichajes(data.data);
    } catch (error) {
      notifications.show({ title: 'Error', message: parseApiError(error), color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [cuidadorId, revision, desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    fetch('/api/v1/cuidadores?all=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.data)) setCuidadores(data.data);
      })
      .catch(() => undefined);
  }, []);

  const revisar = async (fichaje: Fichaje, nuevaRevision: 'APROBADO' | 'RECHAZADO', notaRevision?: string) => {
    setGuardando(true);
    try {
      const res = await fetch(`/api/v1/fichajes/${fichaje.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision: nuevaRevision, notaRevision: notaRevision || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error?.message || 'No se pudo guardar');

      notifications.show({
        title: 'Listo',
        message: nuevaRevision === 'APROBADO' ? 'Fichaje aprobado' : 'Fichaje rechazado',
        color: 'green',
      });
      setRechazando(null);
      setNota('');
      cargar();
    } catch (error) {
      notifications.show({ title: 'Error', message: parseApiError(error), color: 'red' });
    } finally {
      setGuardando(false);
    }
  };

  const resumen = useMemo(() => {
    const pendientes = fichajes.filter((f) => f.revision === 'PENDIENTE').length;
    const abiertos = fichajes.filter((f) => !f.salidaAt).length;
    const horas = fichajes.reduce((acc, f) => acc + (f.horas ?? 0), 0);
    return { pendientes, abiertos, horas: Math.round(horas * 100) / 100 };
  }, [fichajes]);

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Presentismo</Title>
        <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={cargar} loading={loading}>
          Actualizar
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="md">
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Fichajes a revisar
          </Text>
          <Text size="xl" fw={700} c={resumen.pendientes > 0 ? 'yellow' : undefined}>
            {resumen.pendientes}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Turnos sin cerrar
          </Text>
          <Text size="xl" fw={700}>
            {resumen.abiertos}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Horas en el período
          </Text>
          <Text size="xl" fw={700} c="cyan">
            {resumen.horas}
          </Text>
        </Card>
      </SimpleGrid>

      <Paper withBorder p="md" mb="md">
        <Group grow align="flex-end">
          <Select
            label="Cuidador"
            placeholder="Todos"
            data={cuidadores.map((c) => ({ value: c.id, label: c.nombreCompleto }))}
            value={cuidadorId}
            onChange={setCuidadorId}
            searchable
            clearable
          />
          <Select
            label="Estado"
            placeholder="Todos"
            data={REVISIONES}
            value={revision}
            onChange={setRevision}
            clearable
          />
          <DateInput label="Desde" value={desde} onChange={(v) => setDesde(v as Date | null)} locale="es" clearable />
          <DateInput label="Hasta" value={hasta} onChange={(v) => setHasta(v as Date | null)} locale="es" clearable />
        </Group>
      </Paper>

      <Paper withBorder p="md">
        {loading ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : (
          <Table.ScrollContainer minWidth={900}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Cuidador</Table.Th>
                  <Table.Th>Persona</Table.Th>
                  <Table.Th>Entrada</Table.Th>
                  <Table.Th>Salida</Table.Th>
                  <Table.Th>Horas</Table.Th>
                  <Table.Th>Distancia</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {fichajes.map((f) => {
                  const badge = BADGE_REVISION[f.revision];
                  return (
                    <Table.Tr key={f.id}>
                      <Table.Td>{f.cuidadorNombre}</Table.Td>
                      <Table.Td>{f.personaNombre}</Table.Td>
                      <Table.Td>{dayjs(f.entradaAt).format('DD/MM/YYYY HH:mm')}</Table.Td>
                      <Table.Td>
                        {f.salidaAt ? (
                          dayjs(f.salidaAt).format('DD/MM/YYYY HH:mm')
                        ) : (
                          <Badge color="orange" variant="light" size="sm">
                            Sin cerrar
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td>{f.horas != null ? `${f.horas} h` : '-'}</Table.Td>
                      <Table.Td>
                        <Text size="sm" c={f.entradaEnRango ? undefined : 'red'}>
                          E: {f.entradaDistanciaM} m
                        </Text>
                        {f.salidaDistanciaM != null && (
                          <Text size="sm" c={f.salidaEnRango ? undefined : 'red'}>
                            S: {f.salidaDistanciaM} m
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge color={badge.color} variant="light">
                          {badge.label}
                        </Badge>
                        {f.notaRevision && (
                          <Text size="xs" c="dimmed">
                            {f.notaRevision}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Anchor
                            href={`https://www.openstreetmap.org/?mlat=${f.entradaLat}&mlon=${f.entradaLng}#map=18/${f.entradaLat}/${f.entradaLng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ver en el mapa dónde marcó la entrada"
                          >
                            <IconMapPin size={18} />
                          </Anchor>
                          {f.revision === 'PENDIENTE' && (
                            <>
                              <Button
                                size="compact-xs"
                                color="green"
                                variant="light"
                                leftSection={<IconCheck size={14} />}
                                loading={guardando}
                                onClick={() => revisar(f, 'APROBADO')}
                              >
                                Aprobar
                              </Button>
                              <Button
                                size="compact-xs"
                                color="red"
                                variant="light"
                                leftSection={<IconX size={14} />}
                                onClick={() => setRechazando(f)}
                              >
                                Rechazar
                              </Button>
                            </>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {fichajes.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={8}>
                      <Text c="dimmed" ta="center" py="md">
                        No hay fichajes en el período seleccionado.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      <Modal opened={!!rechazando} onClose={() => setRechazando(null)} title="Rechazar fichaje" centered>
        <Stack>
          <Text size="sm">
            {rechazando?.cuidadorNombre} en {rechazando?.personaNombre} —{' '}
            {rechazando && dayjs(rechazando.entradaAt).format('DD/MM/YYYY HH:mm')}
          </Text>
          <Textarea
            label="Motivo"
            placeholder="Por qué no se toma como válido"
            value={nota}
            onChange={(e) => setNota(e.currentTarget.value)}
            autosize
            minRows={2}
          />
          <Button color="red" loading={guardando} onClick={() => rechazando && revisar(rechazando, 'RECHAZADO', nota)}>
            Rechazar fichaje
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
