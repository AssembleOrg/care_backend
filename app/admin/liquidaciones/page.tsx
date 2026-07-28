'use client';

import { Container, Title, Paper, Stack, Group, Text, Select, NumberInput, Button, Card, SimpleGrid, Divider, Modal, Table, Badge, Loader, Alert, Tooltip, ActionIcon } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { parseApiError } from '../utils/parseApiError';
import { IconCalculator, IconCheck, IconCalendar, IconCurrencyDollar, IconClockHour4, IconAlertTriangle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

interface Cuidador {
  id: string;
  nombreCompleto: string;
}

interface FichajeResumen {
  id: string;
  personaNombre: string;
  entradaAt: string;
  salidaAt: string;
  horas: number;
  pendienteDeRevision: boolean;
}

interface ResumenHoras {
  desde: string | null;
  hasta: string | null;
  totalHoras: number;
  horasPendientes: number;
  turnosSinCerrar: number;
  ultimaLiquidacion: { fecha: string; semanaFin: string; horasTrabajadas: number } | null;
  detalle: FichajeResumen[];
}

export default function LiquidacionesPage() {
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([]);
  const [cuidadorId, setCuidadorId] = useState<string>('');
  const [precioPorHora, setPrecioPorHora] = useState<number>(0);
  const [fechaInicio, setFechaInicio] = useState<Date | null>(new Date());
  const [fechaFin, setFechaFin] = useState<Date | null>(new Date());
  const [horasTrabajadas, setHorasTrabajadas] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const [resumen, setResumen] = useState<ResumenHoras | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);

  useEffect(() => {
    fetch('/api/v1/cuidadores?all=true')
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.data)) {
          setCuidadores(data.data);
        }
      })
      .catch(err => console.error('Error fetching cuidadores:', err));
  }, []);

  // Precargar datos desde localStorage si vienen de liquidación rápida
  useEffect(() => {
    const liquidacionRapida = localStorage.getItem('liquidacionRapida');
    if (liquidacionRapida) {
      try {
        const data = JSON.parse(liquidacionRapida);
        setCuidadorId(data.cuidadorId || '');
        setPrecioPorHora(data.precioPorHora || 0);
        setFechaInicio(data.fechaInicio ? new Date(data.fechaInicio) : new Date());
        setFechaFin(data.fechaFin ? new Date(data.fechaFin) : new Date());
        setHorasTrabajadas(data.horasTrabajadas || 0);
        // Limpiar localStorage después de usar
        localStorage.removeItem('liquidacionRapida');
      } catch (err) {
        console.error('Error parsing liquidacionRapida:', err);
        localStorage.removeItem('liquidacionRapida');
      }
    }
  }, []);

  // Calcular total automáticamente
  const totalMonto = useMemo(() => {
    return horasTrabajadas * precioPorHora;
  }, [horasTrabajadas, precioPorHora]);

  // Horas fichadas desde la última liquidación del cuidador seleccionado.
  const abrirResumen = async () => {
    if (!cuidadorId) {
      notifications.show({ title: 'Falta el cuidador', message: 'Elegí primero a quién vas a liquidar', color: 'red' });
      return;
    }
    setResumenAbierto(true);
    setCargandoResumen(true);
    setResumen(null);
    try {
      const res = await fetch(`/api/v1/fichajes/resumen?cuidadorId=${cuidadorId}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error?.message || 'No se pudieron cargar las horas fichadas');
      setResumen(data.data);
    } catch (error: unknown) {
      notifications.show({ title: 'Error', message: parseApiError(error), color: 'red' });
      setResumenAbierto(false);
    } finally {
      setCargandoResumen(false);
    }
  };

  const usarHorasFichadas = () => {
    if (!resumen) return;
    setHorasTrabajadas(resumen.totalHoras);
    if (resumen.desde) setFechaInicio(new Date(resumen.desde));
    if (resumen.hasta) setFechaFin(new Date(resumen.hasta));
    setResumenAbierto(false);
    notifications.show({
      title: 'Horas cargadas',
      message: `Se cargaron ${resumen.totalHoras} horas fichadas. Podés ajustarlas antes de liquidar.`,
      color: 'green',
    });
  };

  const handleLiquidar = async () => {
    if (!cuidadorId) {
      notifications.show({
        title: 'Error',
        message: 'Seleccioná un cuidador',
        color: 'red',
      });
      return;
    }

    if (!precioPorHora || precioPorHora <= 0) {
      notifications.show({
        title: 'Error',
        message: 'Ingresá un precio por hora válido',
        color: 'red',
      });
      return;
    }

    if (!fechaInicio || !fechaFin) {
      notifications.show({
        title: 'Error',
        message: 'Seleccioná fecha de inicio y fin',
        color: 'red',
      });
      return;
    }

    if (fechaInicio > fechaFin) {
      notifications.show({
        title: 'Error',
        message: 'La fecha de inicio debe ser anterior a la fecha de fin',
        color: 'red',
      });
      return;
    }

    if (!horasTrabajadas || horasTrabajadas <= 0) {
      notifications.show({
        title: 'Error',
        message: 'Ingresá las horas trabajadas',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      // Asegurar que las fechas sean objetos Date
      const fechaInicioDate = fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
      const fechaFinDate = fechaFin instanceof Date ? fechaFin : new Date(fechaFin);

      const response = await fetch('/api/v1/liquidaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuidadorId,
          precioPorHora,
          fechaInicio: fechaInicioDate.toISOString(),
          fechaFin: fechaFinDate.toISOString(),
          horasTrabajadas,
          monto: totalMonto,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || 'Error al liquidar');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Liquidación creada correctamente',
        color: 'green',
      });

      // Generar comprobante
      if (data.data?.id) {
        const pdfResponse = await fetch(`/api/v1/liquidaciones/${data.data.id}/recibo.pdf`);
        if (pdfResponse.ok) {
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `liquidacion-${data.data.id}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }

      // Reset form
      setCuidadorId('');
      setPrecioPorHora(0);
      setFechaInicio(new Date());
      setFechaFin(new Date());
      setHorasTrabajadas(0);
    } catch (error: unknown) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">
        Liquidación de Honorarios
      </Title>

      <Stack gap="xl">
        {/* Configuración */}
        <Paper p="lg" withBorder>
          <Stack gap="lg">
            <Group>
              <IconCurrencyDollar size={24} />
              <Title order={3}>Configuración de Liquidación</Title>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Group align="flex-end" gap="xs" wrap="nowrap">
                <Select
                  label="Cuidador"
                  required
                  placeholder="Seleccionar cuidador"
                  data={cuidadores.map(c => ({ value: c.id, label: c.nombreCompleto }))}
                  value={cuidadorId}
                  onChange={(value) => setCuidadorId(value || '')}
                  searchable
                  style={{ flex: 1 }}
                />
                <Tooltip label="Ver horas fichadas desde la última liquidación">
                  <ActionIcon
                    size={36}
                    variant="light"
                    color="cyan"
                    onClick={abrirResumen}
                    disabled={!cuidadorId}
                    aria-label="Ver horas fichadas"
                  >
                    <IconClockHour4 size={20} />
                  </ActionIcon>
                </Tooltip>
              </Group>
              <NumberInput
                label="Precio por hora"
                required
                placeholder="0,00"
                min={0}
                step={100}
                value={precioPorHora}
                onChange={(value) => setPrecioPorHora(Number(value) || 0)}
                leftSection="$"
                thousandSeparator="."
                decimalSeparator=","
              />
            </SimpleGrid>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <DateInput
                label="Fecha de inicio"
                required
                placeholder="Seleccionar fecha"
                value={fechaInicio}
                onChange={(value) => {
                  const dateValue = value as Date | null;
                  setFechaInicio(dateValue);
                }}
                locale="es"
                leftSection={<IconCalendar size={18} />}
              />
              <DateInput
                label="Fecha de fin"
                required
                placeholder="Seleccionar fecha"
                value={fechaFin}
                onChange={(value) => {
                  const dateValue = value as Date | null;
                  setFechaFin(dateValue);
                }}
                locale="es"
                leftSection={<IconCalendar size={18} />}
              />
            </SimpleGrid>
            <NumberInput
              label="Horas trabajadas"
              required
              placeholder="0,00"
              min={0}
              step={0.5}
              decimalScale={2}
              value={horasTrabajadas}
              onChange={(value) => setHorasTrabajadas(Number(value) || 0)}
              leftSection={<IconCalculator size={18} />}
              description="Ingresá el total de horas trabajadas en el período"
            />
          </Stack>
        </Paper>

        {/* Resumen */}
        <Card shadow="sm" padding="xl" radius="md" withBorder>
          <Stack gap="lg">
            <Group>
              <IconCalculator size={28} />
              <Title order={3}>Resumen de Liquidación</Title>
            </Group>
            
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
              <div>
                <Text size="sm" c="dimmed" fw={500} mb={4}>Período</Text>
                <Text size="md" fw={600}>
                  {fechaInicio && fechaFin 
                    ? `${dayjs(fechaInicio).format('DD/MM/YYYY')} - ${dayjs(fechaFin).format('DD/MM/YYYY')}`
                    : 'No seleccionado'
                  }
                </Text>
              </div>
              <div>
                <Text size="sm" c="dimmed" fw={500} mb={4}>Horas trabajadas</Text>
                <Text size="xl" fw={700} c="cyan">
                  {horasTrabajadas.toFixed(2)} horas
                </Text>
              </div>
              <div>
                <Text size="sm" c="dimmed" fw={500} mb={4}>Total a liquidar</Text>
                <Text size="xl" fw={700} c="fucsia">
                  ${totalMonto.toFixed(2)}
                </Text>
              </div>
            </SimpleGrid>

            <Divider />

            <Button
              size="lg"
              fullWidth
              leftSection={<IconCalculator size={20} />}
              rightSection={<IconCheck size={20} />}
              onClick={handleLiquidar}
              loading={loading}
              disabled={!cuidadorId || !precioPorHora || !fechaInicio || !fechaFin || !horasTrabajadas || horasTrabajadas <= 0}
            >
              Liquidar
            </Button>
          </Stack>
        </Card>
      </Stack>

      <Modal
        opened={resumenAbierto}
        onClose={() => setResumenAbierto(false)}
        title="Horas fichadas desde la última liquidación"
        size="lg"
        centered
      >
        {cargandoResumen ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : resumen ? (
          <Stack>
            <Text size="sm" c="dimmed">
              {resumen.ultimaLiquidacion
                ? `Última liquidación: hasta el ${dayjs(resumen.ultimaLiquidacion.semanaFin).format('DD/MM/YYYY')} (${resumen.ultimaLiquidacion.horasTrabajadas} h).`
                : 'Este cuidador todavía no tiene liquidaciones: se muestran todos sus fichajes.'}
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Card withBorder padding="sm">
                <Text size="xs" c="dimmed">
                  Total fichado
                </Text>
                <Text size="xl" fw={700} c="cyan">
                  {resumen.totalHoras} h
                </Text>
              </Card>
              <Card withBorder padding="sm">
                <Text size="xs" c="dimmed">
                  Período
                </Text>
                <Text size="sm" fw={600}>
                  {resumen.desde ? dayjs(resumen.desde).format('DD/MM/YYYY') : '-'} →{' '}
                  {resumen.hasta ? dayjs(resumen.hasta).format('DD/MM/YYYY') : '-'}
                </Text>
              </Card>
            </SimpleGrid>

            {resumen.horasPendientes > 0 && (
              <Alert color="yellow" icon={<IconAlertTriangle size={16} />} py="xs">
                {resumen.horasPendientes} h vienen de fichajes fuera de radio todavía sin revisar. Están incluidas en el
                total.
              </Alert>
            )}
            {resumen.turnosSinCerrar > 0 && (
              <Alert color="orange" icon={<IconAlertTriangle size={16} />} py="xs">
                Hay {resumen.turnosSinCerrar} turno(s) sin marcar la salida: esas horas no se cuentan.
              </Alert>
            )}

            {resumen.detalle.length === 0 ? (
              <Text c="dimmed" ta="center" py="md">
                No hay fichajes cerrados en el período.
              </Text>
            ) : (
              <Table.ScrollContainer minWidth={480} mah={320}>
                <Table highlightOnHover striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Día</Table.Th>
                      <Table.Th>Persona</Table.Th>
                      <Table.Th>Horario</Table.Th>
                      <Table.Th>Horas</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {resumen.detalle.map((d) => (
                      <Table.Tr key={d.id}>
                        <Table.Td>{dayjs(d.entradaAt).format('DD/MM/YYYY')}</Table.Td>
                        <Table.Td>
                          {d.personaNombre}
                          {d.pendienteDeRevision && (
                            <Badge color="yellow" variant="light" size="xs" ml={6}>
                              a revisar
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          {dayjs(d.entradaAt).format('HH:mm')} - {dayjs(d.salidaAt).format('HH:mm')}
                        </Table.Td>
                        <Table.Td>{d.horas}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}

            <Button onClick={usarHorasFichadas} disabled={resumen.totalHoras <= 0} leftSection={<IconCheck size={18} />}>
              Usar estas horas ({resumen.totalHoras} h)
            </Button>
          </Stack>
        ) : null}
      </Modal>
    </Container>
  );
}
