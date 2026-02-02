'use client';

import { Container, Title, Paper, Stack, Group, Button, Text, Select, ActionIcon, Modal, Badge, NumberInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconChevronLeft, IconChevronRight, IconCalendar, IconCurrencyDollar } from '@tabler/icons-react';
import { parseApiError } from '../../utils/parseApiError';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import styles from './calendario.module.css';

dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.locale('es');

interface Horario {
  diaSemana: number;
}

interface CuidadorAsignacion {
  horas: number;
  precioPorHora: number;
}

interface Asignacion {
  id: string;
  cuidadoresIds: string[];
  personaId: string;
  cuidadoresNombres?: string[];
  personaNombre?: string;
  fechaInicio: string;
  fechaFin: string | null;
  horarios: Horario[] | null;
  horasPorCuidador: Record<string, CuidadorAsignacion> | null;
  notas: string | null;
}

interface Cuidador {
  id: string;
  nombreCompleto: string;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function CalendarioPage() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([]);
  const [semanaActual, setSemanaActual] = useState<Date>(new Date());
  const [cuidadorFiltro, setCuidadorFiltro] = useState<string>('');
  const [selectedAsignacion, setSelectedAsignacion] = useState<Asignacion | null>(null);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [liquidacionOpened, { open: openLiquidacion, close: closeLiquidacion }] = useDisclosure(false);
  const [selectedCuidadorId, setSelectedCuidadorId] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const liquidacionForm = useForm({
    initialValues: {
      cuidadorId: '',
      precioPorHora: 0,
      fechaInicio: new Date(),
      fechaFin: new Date(),
      horasTrabajadas: 0,
    },
  });

  const fetchAsignaciones = async () => {
    try {
      const params = new URLSearchParams();
      
      if (semanaActual) {
        params.set('semana', dayjs(semanaActual).toISOString());
      }
      
      if (cuidadorFiltro) {
        params.set('cuidadorId', cuidadorFiltro);
      }

      const response = await fetch(`/api/v1/asignaciones/calendario?${params}`);
      const data = await response.json();
      if (data.ok && Array.isArray(data.data)) {
        setAsignaciones(data.data);
      }
    } catch (err) {
      console.error('Error fetching asignaciones:', err);
    }
  };

  useEffect(() => {
    fetchAsignaciones();
  }, [semanaActual, cuidadorFiltro]);

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

  const inicioSemana = useMemo(() => dayjs(semanaActual).startOf('isoWeek'), [semanaActual]);
  const finSemana = useMemo(() => dayjs(semanaActual).endOf('isoWeek'), [semanaActual]);
  const diasSemana = useMemo(() => Array.from({ length: 7 }, (_, i) => inicioSemana.add(i, 'day')), [inicioSemana]);

  const asignacionesFiltradas = useMemo(() => {
    let filtradas = asignaciones;
    
    if (cuidadorFiltro) {
      filtradas = filtradas.filter(a => a.cuidadoresIds.includes(cuidadorFiltro));
    }
    
    return filtradas;
  }, [asignaciones, cuidadorFiltro]);

  // Verificar si un día específico de la semana está dentro del rango de fechas de la asignación
  const esDiaValido = (asignacion: Asignacion, diaIndex: number) => {
    const fechaDia = inicioSemana.add(diaIndex, 'day').startOf('day');
    const fechaInicio = dayjs(asignacion.fechaInicio).startOf('day');
    const fechaFin = asignacion.fechaFin ? dayjs(asignacion.fechaFin).startOf('day') : null;
    
    if (fechaDia.isBefore(fechaInicio, 'day')) return false;
    if (fechaFin && fechaDia.isAfter(fechaFin, 'day')) return false;
    
    return true;
  };

  const obtenerAsignacionesPorDia = (diaIndex: number) => {
    return asignacionesFiltradas.filter(a => {
      // Verificar que el día esté dentro del rango de fechas
      if (!esDiaValido(a, diaIndex)) return false;
      // Si hay horarios, verificar que el día esté incluido
      if (a.horarios && a.horarios.length > 0) {
        return a.horarios.some((h: Horario) => h.diaSemana === diaIndex);
      }
      // Si no hay horarios, mostrar la asignación en todos los días válidos
      return true;
    });
  };

  const obtenerColor = (personaId: string) => {
    const personas = Array.from(new Set(asignaciones.map(a => a.personaId)));
    const index = personas.indexOf(personaId);
    const colores = ['#FF6B9D', '#00CED1', '#FFD700', '#FF8C69', '#9370DB', '#20B2AA', '#FF69B4'];
    return colores[index % colores.length];
  };

  const semanaAnterior = () => {
    setSemanaActual(dayjs(semanaActual).subtract(1, 'week').toDate());
  };

  const semanaSiguiente = () => {
    setSemanaActual(dayjs(semanaActual).add(1, 'week').toDate());
  };

  const hoy = () => {
    setSemanaActual(new Date());
  };

  const handleClickAsignacion = (asignacion: Asignacion) => {
    setSelectedAsignacion(asignacion);
    openView();
  };

  const handleLiquidacionRapida = (asignacion: Asignacion) => {
    setSelectedAsignacion(asignacion);
    setSelectedCuidadorId('');
    openLiquidacion();
  };

  const handleLiquidar = async (values: typeof liquidacionForm.values) => {
    if (!selectedAsignacion || !values.cuidadorId) {
      notifications.show({
        title: 'Error',
        message: 'Seleccioná un cuidador',
        color: 'red',
      });
      return;
    }

    try {
      const fechaInicioDate = values.fechaInicio instanceof Date ? values.fechaInicio : new Date(values.fechaInicio);
      const fechaFinDate = values.fechaFin instanceof Date ? values.fechaFin : new Date(values.fechaFin);

      const response = await fetch('/api/v1/liquidaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuidadorId: values.cuidadorId,
          precioPorHora: values.precioPorHora,
          fechaInicio: fechaInicioDate.toISOString(),
          fechaFin: fechaFinDate.toISOString(),
          horasTrabajadas: values.horasTrabajadas,
          monto: values.horasTrabajadas * values.precioPorHora,
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

      closeLiquidacion();
      fetchAsignaciones();
    } catch (error: unknown) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    }
  };

  // Precargar datos cuando se selecciona un cuidador
  useEffect(() => {
    if (selectedCuidadorId && selectedAsignacion) {
      const data = selectedAsignacion.horasPorCuidador?.[selectedCuidadorId];
      liquidacionForm.setValues({
        cuidadorId: selectedCuidadorId,
        precioPorHora: data?.precioPorHora || 0,
        fechaInicio: new Date(selectedAsignacion.fechaInicio),
        fechaFin: selectedAsignacion.fechaFin ? new Date(selectedAsignacion.fechaFin) : new Date(),
        horasTrabajadas: data?.horas || 0,
      });
    }
  }, [selectedCuidadorId, selectedAsignacion]);

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Calendario de Asignaciones</Title>
        <Button component="a" href="/admin/asignaciones" variant="subtle">
          Volver a Asignaciones
        </Button>
      </Group>

      <Paper p="md" withBorder mb="xl">
        <Stack>
          <Group>
            <Select
              label="Filtrar por cuidador"
              placeholder="Todos los cuidadores"
              clearable
              data={cuidadores.map(c => ({ value: c.id, label: c.nombreCompleto }))}
              value={cuidadorFiltro}
              onChange={(value) => setCuidadorFiltro(value || '')}
              style={{ flex: 1 }}
            />
            <DateInput
              label="Semana"
              value={semanaActual}
              onChange={(value) => {
                if (value) {
                  setSemanaActual(value as unknown as Date);
                }
              }}
              locale="es"
              style={{ flex: 1 }}
            />
          </Group>
          <Group>
            <ActionIcon variant="light" onClick={semanaAnterior}>
              <IconChevronLeft size={16} />
            </ActionIcon>
            <Text fw={600}>
              {inicioSemana.format('DD/MM/YYYY')} - {finSemana.format('DD/MM/YYYY')}
            </Text>
            <ActionIcon variant="light" onClick={semanaSiguiente}>
              <IconChevronRight size={16} />
            </ActionIcon>
            <Button size="xs" variant="subtle" onClick={hoy}>
              Hoy
            </Button>
          </Group>
        </Stack>
      </Paper>

      {/* Vista Desktop: Tabla de calendario */}
      {!isMobile && (
        <Paper p="md" withBorder>
          <div className={styles.calendarWrapper}>
            <table className={styles.calendarTable}>
              <thead>
                <tr>
                  {diasSemana.map((dia, index) => (
                    <th key={index} className={styles.dayColumn}>
                      <Text fw={600}>{DIAS_SEMANA[index]}</Text>
                      <Text size="xs" c="dimmed">
                        {dia.format('DD/MM')}
                      </Text>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {diasSemana.map((dia, diaIndex) => {
                    const asignacionesDia = obtenerAsignacionesPorDia(diaIndex);
                    const esHoy = dia.isSame(dayjs(), 'day');

                    return (
                      <td
                        key={diaIndex}
                        className={styles.dayCell}
                        style={{
                          backgroundColor: esHoy ? 'var(--mantine-color-yellow-0)' : undefined,
                        }}
                      >
                        <Stack gap="xs" style={{ minHeight: '200px' }}>
                          {asignacionesDia.map((asignacion) => {
                            const color = obtenerColor(asignacion.personaId);

                            return (
                              <Paper
                                key={asignacion.id}
                                p="xs"
                                style={{
                                  backgroundColor: color,
                                  color: 'white',
                                  cursor: 'pointer',
                                  borderRadius: '4px',
                                }}
                                onClick={() => handleClickAsignacion(asignacion)}
                              >
                                <Text size="xs" fw={600} truncate>
                                  {asignacion.personaNombre || asignacion.personaId}
                                </Text>
                                <Group gap="xs" mt={4}>
                                  {asignacion.cuidadoresNombres && asignacion.cuidadoresNombres.length > 0 ? (
                                    <Text size="xs" truncate>
                                      {asignacion.cuidadoresNombres.join(', ')}
                                    </Text>
                                  ) : (
                                    <Text size="xs" truncate>
                                      {asignacion.cuidadoresIds.length} cuidador(es)
                                    </Text>
                                  )}
                                </Group>
                                {asignacion.horasPorCuidador && (
                                  <Text size="xs" mt={4}>
                                    {Object.values(asignacion.horasPorCuidador).reduce((sum, d) => sum + d.horas, 0).toFixed(1)}h
                                  </Text>
                                )}
                              </Paper>
                            );
                          })}
                          {asignacionesDia.length > 0 && (
                            <Button
                              size="xs"
                              variant="light"
                              color="cyan"
                              leftSection={<IconCurrencyDollar size={14} />}
                              onClick={() => handleLiquidacionRapida(asignacionesDia[0])}
                              mt="auto"
                            >
                              Liquidar
                            </Button>
                          )}
                        </Stack>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </Paper>
      )}

      {/* Vista Mobile: Lista por día */}
      {isMobile && (
        <Stack gap="md">
          {diasSemana.map((dia, diaIndex) => {
            const asignacionesDia = obtenerAsignacionesPorDia(diaIndex);
            const esHoy = dia.isSame(dayjs(), 'day');

            return (
              <Paper
                key={diaIndex}
                p="md"
                withBorder
                className={`${styles.dayCard} ${esHoy ? styles.dayCardToday : ''}`}
              >
                <div className={styles.dayHeader}>
                  <div className={styles.dayTitle}>
                    <IconCalendar size={20} className={styles.dayIcon} />
                    <div>
                      <Text fw={700} size="lg">
                        {DIAS_SEMANA[diaIndex]}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {dia.format('DD/MM/YYYY')}
                      </Text>
                    </div>
                  </div>
                  {esHoy && (
                    <Badge color="yellow" variant="light" size="lg">
                      Hoy
                    </Badge>
                  )}
                </div>

                {asignacionesDia.length > 0 ? (
                  <Stack gap="xs" mt="md">
                    {asignacionesDia.map((asignacion) => {
                      const color = obtenerColor(asignacion.personaId);

                      return (
                        <Paper
                          key={asignacion.id}
                          p="sm"
                          withBorder
                          onClick={() => handleClickAsignacion(asignacion)}
                          style={{ borderLeftColor: color, borderLeftWidth: '4px', cursor: 'pointer' }}
                        >
                          <Text fw={600} size="sm">
                            {asignacion.personaNombre || asignacion.personaId}
                          </Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            {asignacion.cuidadoresNombres?.join(', ') || `${asignacion.cuidadoresIds.length} cuidador(es)`}
                          </Text>
                          {asignacion.horasPorCuidador && (
                            <Text size="xs" mt={4}>
                              {Object.values(asignacion.horasPorCuidador).reduce((sum, d) => sum + d.horas, 0).toFixed(1)} horas
                            </Text>
                          )}
                          <Button
                            size="xs"
                            variant="light"
                            color="cyan"
                            leftSection={<IconCurrencyDollar size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLiquidacionRapida(asignacion);
                            }}
                            mt="xs"
                          >
                            Liquidar
                          </Button>
                        </Paper>
                      );
                    })}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    No hay asignaciones para este día
                  </Text>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Modal Ver Asignación */}
      <Modal opened={viewOpened} onClose={closeView} title="Detalle de Asignación" size="lg">
        {selectedAsignacion && (
          <Stack gap="md">
            <Group>
              <Text fw={600}>Cuidadores:</Text>
              <Group gap="xs">
                {selectedAsignacion.cuidadoresNombres && selectedAsignacion.cuidadoresNombres.length > 0
                  ? selectedAsignacion.cuidadoresNombres.map((nombre, idx) => (
                      <Badge key={idx} size="lg" variant="light" color="fucsia">
                        {nombre}
                      </Badge>
                    ))
                  : selectedAsignacion.cuidadoresIds.map((id, idx) => (
                      <Badge key={idx} size="lg" variant="light">
                        {id}
                      </Badge>
                    ))}
              </Group>
            </Group>
            <Group>
              <Text fw={600}>Persona Asistida:</Text>
              <Text>{selectedAsignacion.personaNombre || selectedAsignacion.personaId}</Text>
            </Group>
            <Group>
              <Text fw={600}>Fecha Inicio:</Text>
              <Text>{new Date(selectedAsignacion.fechaInicio).toLocaleDateString('es-AR')}</Text>
            </Group>
            {selectedAsignacion.fechaFin && (
              <Group>
                <Text fw={600}>Fecha Fin:</Text>
                <Text>{new Date(selectedAsignacion.fechaFin).toLocaleDateString('es-AR')}</Text>
              </Group>
            )}
            {selectedAsignacion.horarios && selectedAsignacion.horarios.length > 0 && (
              <Stack gap="xs">
                <Text fw={600}>Días de Trabajo:</Text>
                <Group gap="xs">
                  {selectedAsignacion.horarios.map((h, idx) => (
                    <Badge key={idx} size="lg" variant="light">
                      {DIAS_SEMANA[h.diaSemana]}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            )}
            {selectedAsignacion.horasPorCuidador && (
              <Stack gap="xs">
                <Text fw={600}>Horas y Precio por Cuidador:</Text>
                <Stack gap="xs">
                  {Object.entries(selectedAsignacion.horasPorCuidador).map(([cuidadorId, data]) => {
                    const cuidadorNombre = selectedAsignacion.cuidadoresNombres?.find((_, idx) => selectedAsignacion.cuidadoresIds[idx] === cuidadorId) || cuidadorId;
                    const subtotal = data.horas * data.precioPorHora;
                    return (
                      <Paper key={cuidadorId} p="sm" withBorder>
                        <Group justify="space-between" mb="xs">
                          <Text fw={600}>{cuidadorNombre}</Text>
                        </Group>
                        <Group gap="md">
                          <Badge size="lg" variant="light" color="cyan">
                            {data.horas.toFixed(2)} horas
                          </Badge>
                          <Badge size="lg" variant="light" color="yellow">
                            ${data.precioPorHora.toLocaleString('es-AR', { useGrouping: true })}/h
                          </Badge>
                          <Badge size="lg" variant="light" color="green">
                            ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </Badge>
                        </Group>
                      </Paper>
                    );
                  })}
                  <Group justify="space-between" mt="sm" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text fw={600}>Total horas:</Text>
                    <Text fw={700} size="lg" c="fucsia">
                      {Object.values(selectedAsignacion.horasPorCuidador).reduce((sum, data) => sum + data.horas, 0).toFixed(2)} horas
                    </Text>
                  </Group>
                  <Group justify="space-between" pt="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text fw={600}>Total a liquidar:</Text>
                    <Text fw={700} size="xl" c="cyan">
                      ${Object.values(selectedAsignacion.horasPorCuidador).reduce((sum, data) => sum + (data.horas * data.precioPorHora), 0).toLocaleString('es-AR', { minimumFractionDigits: 2, useGrouping: true })}
                    </Text>
                  </Group>
                </Stack>
              </Stack>
            )}
            {selectedAsignacion.notas && (
              <Group>
                <Text fw={600}>Notas:</Text>
                <Text style={{ fontStyle: 'italic' }}>{selectedAsignacion.notas}</Text>
              </Group>
            )}
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeView}>
                Cerrar
              </Button>
              <Button color="cyan" leftSection={<IconCurrencyDollar size={16} />} onClick={() => { closeView(); handleLiquidacionRapida(selectedAsignacion); }}>
                Liquidar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Modal Liquidación Rápida */}
      <Modal opened={liquidacionOpened} onClose={closeLiquidacion} title="Liquidación Rápida" size="lg">
        {selectedAsignacion && (
          <form onSubmit={liquidacionForm.onSubmit(handleLiquidar)}>
            <Stack gap="md">
              <Paper p="sm" withBorder bg="gray.0">
                <Text size="sm" fw={600}>
                  Persona Asistida: {selectedAsignacion.personaNombre || selectedAsignacion.personaId}
                </Text>
              </Paper>

              <Select
                label="Cuidador"
                required
                placeholder="Seleccionar cuidador"
                data={selectedAsignacion.cuidadoresIds.map(id => {
                  const cuidador = cuidadores.find(c => c.id === id);
                  return {
                    value: id,
                    label: cuidador?.nombreCompleto || id,
                  };
                })}
                value={selectedCuidadorId}
                onChange={(value) => setSelectedCuidadorId(value || '')}
              />

              <NumberInput
                label="Precio por hora"
                required
                placeholder="0,00"
                min={0}
                step={100}
                {...liquidacionForm.getInputProps('precioPorHora')}
                leftSection="$"
                thousandSeparator="."
                decimalSeparator=","
              />

              <DateInput
                label="Fecha de inicio"
                required
                locale="es"
                {...liquidacionForm.getInputProps('fechaInicio')}
              />

              <DateInput
                label="Fecha de fin"
                required
                locale="es"
                {...liquidacionForm.getInputProps('fechaFin')}
              />

              <NumberInput
                label="Horas trabajadas"
                required
                placeholder="0.00"
                min={0}
                step={0.5}
                decimalScale={2}
                {...liquidacionForm.getInputProps('horasTrabajadas')}
                leftSection="H"
                description="Horas trabajadas en el período"
              />

              <Paper p="md" withBorder bg="cyan.0">
                <Group justify="space-between">
                  <Text fw={600}>Total a liquidar:</Text>
                  <Text fw={700} size="xl" c="cyan">
                    ${(liquidacionForm.values.horasTrabajadas * liquidacionForm.values.precioPorHora).toLocaleString('es-AR', { minimumFractionDigits: 2, useGrouping: true })}
                  </Text>
                </Group>
              </Paper>

              <Group justify="flex-end" mt="md">
                <Button variant="subtle" onClick={closeLiquidacion}>
                  Cancelar
                </Button>
                <Button type="submit" color="cyan" leftSection={<IconCurrencyDollar size={16} />}>
                  Liquidar
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>
    </Container>
  );
}
