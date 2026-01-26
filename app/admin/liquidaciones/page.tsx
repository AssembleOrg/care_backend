'use client';

import { Container, Title, Paper, Stack, Group, Text, Select, NumberInput, Button, Card, Table, Badge, Divider, Checkbox, SimpleGrid } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { extractApiErrorMessage, parseApiError } from '../utils/parseApiError';
import { IconCalculator, IconCheck, IconCalendar, IconClock, IconCurrencyDollar } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import styles from './liquidaciones.module.css';

dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.locale('es');

interface Cuidador {
  id: string;
  nombreCompleto: string;
}

interface Horario {
  dia: number; // 0 = lunes, 6 = domingo
  diaNombre: string;
  horaInicio: string;
  horaFin: string;
  horas: number;
  incluir: boolean; // Checkbox para incluir/excluir el día
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function LiquidacionesPage() {
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([]);
  const [cuidadorId, setCuidadorId] = useState<string>('');
  const [precioPorHora, setPrecioPorHora] = useState<number>(0);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<Date | null>(new Date());
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Inicializar horarios de la semana (todos desactivados por defecto)
  useEffect(() => {
    if (semanaSeleccionada) {
      const nuevosHorarios: Horario[] = [];
      
      for (let i = 0; i < 7; i++) {
        nuevosHorarios.push({
          dia: i,
          diaNombre: DIAS_SEMANA[i],
          horaInicio: '09:00',
          horaFin: '17:00',
          horas: 0,
          incluir: false, // Default: no incluir
        });
      }
      
      setHorarios(nuevosHorarios);
    }
  }, [semanaSeleccionada]);

  // Calcular horas cuando cambian los horarios
  const calcularHoras = (horaInicio: string, horaFin: string): number => {
    if (!horaInicio || !horaFin) return 0;
    
    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);
    
    const inicio = hInicio * 60 + mInicio;
    const fin = hFin * 60 + mFin;
    
    if (fin <= inicio) return 0;
    
    return (fin - inicio) / 60;
  };

  // Actualizar horas cuando cambian inicio/fin
  const actualizarHorario = (index: number, campo: 'horaInicio' | 'horaFin' | 'incluir', valor: string | boolean) => {
    const nuevosHorarios = [...horarios];
    
    if (campo === 'incluir') {
      nuevosHorarios[index] = {
        ...nuevosHorarios[index],
        incluir: valor as boolean,
      };
      
      // Si se activa el checkbox, calcular las horas
      if (valor) {
        nuevosHorarios[index].horas = calcularHoras(
          nuevosHorarios[index].horaInicio,
          nuevosHorarios[index].horaFin
        );
      } else {
        // Si se desactiva, poner horas en 0
        nuevosHorarios[index].horas = 0;
      }
    } else {
      nuevosHorarios[index] = {
        ...nuevosHorarios[index],
        [campo]: valor,
      };
      
      // Recalcular horas solo si está incluido
      if (nuevosHorarios[index].incluir) {
        const horas = calcularHoras(
          nuevosHorarios[index].horaInicio,
          nuevosHorarios[index].horaFin
        );
        nuevosHorarios[index].horas = horas;
      }
    }
    
    setHorarios(nuevosHorarios);
  };

  // Calcular totales (solo de días incluidos)
  const totales = useMemo(() => {
    const horariosIncluidos = horarios.filter(h => h.incluir);
    const totalHoras = horariosIncluidos.reduce((sum, h) => sum + h.horas, 0);
    const totalMonto = totalHoras * precioPorHora;
    const diasTrabajados = horariosIncluidos.length;
    return { totalHoras, totalMonto, diasTrabajados };
  }, [horarios, precioPorHora]);

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

    if (!semanaSeleccionada) {
      notifications.show({
        title: 'Error',
        message: 'Seleccioná una semana',
        color: 'red',
      });
      return;
    }

    if (totales.totalHoras === 0) {
      notifications.show({
        title: 'Error',
        message: 'Seleccioná al menos un día para liquidar',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const inicioSemana = dayjs(semanaSeleccionada).startOf('isoWeek');
      const finSemana = dayjs(semanaSeleccionada).endOf('isoWeek');

      // Solo enviar los días incluidos
      const horariosParaEnviar = horarios
        .filter(h => h.incluir)
        .map(h => ({
          dia: h.dia,
          diaNombre: h.diaNombre,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          horas: h.horas,
        }));

      const response = await fetch('/api/v1/liquidaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuidadorId,
          precioPorHora,
          semanaInicio: inicioSemana.toISOString(),
          semanaFin: finSemana.toISOString(),
          horarios: horariosParaEnviar,
          monto: totales.totalMonto,
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
        const pdfResponse = await fetch(`/api/v1/pagos/${data.data.id}/recibo.pdf`);
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

      // Reset - todos los checkboxes a false
      setHorarios(horarios.map(h => ({ ...h, horaInicio: '09:00', horaFin: '17:00', horas: 0, incluir: false })));
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

  const inicioSemana = semanaSeleccionada ? dayjs(semanaSeleccionada).startOf('isoWeek') : null;
  const finSemana = semanaSeleccionada ? dayjs(semanaSeleccionada).endOf('isoWeek') : null;

  // Seleccionar/deseleccionar todos
  const toggleAll = (incluir: boolean) => {
    const nuevosHorarios = horarios.map(h => ({
      ...h,
      incluir,
      horas: incluir ? calcularHoras(h.horaInicio, h.horaFin) : 0,
    }));
    setHorarios(nuevosHorarios);
  };

  const allSelected = horarios.every(h => h.incluir);
  const noneSelected = horarios.every(h => !h.incluir);

  return (
    <div className={styles.liquidacionesPage}>
      <Container size="xl" py="xl">
        <div className={styles.pageHeader}>
          <Title order={1} className={styles.pageTitle}>
            Liquidación de Honorarios
          </Title>
          {inicioSemana && finSemana && (
            <Text size="lg" className={styles.weekRange}>
              <IconCalendar size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Semana del {inicioSemana.format('DD/MM/YYYY')} al {finSemana.format('DD/MM/YYYY')}
            </Text>
          )}
        </div>

        <Stack gap="xl">
          {/* Selección de cuidador y tarifa */}
          <Paper p="lg" withBorder className={styles.configCard}>
            <Stack gap="lg">
              <div className={styles.configHeader}>
                <IconCurrencyDollar size={24} className={styles.configIcon} />
                <Title order={3}>Configuración de Liquidación</Title>
              </div>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Select
                  label="Cuidador"
                  required
                  placeholder="Seleccionar cuidador"
                  data={cuidadores.map(c => ({ value: c.id, label: c.nombreCompleto }))}
                  value={cuidadorId}
                  onChange={(value) => setCuidadorId(value || '')}
                  searchable
                />
                <NumberInput
                  label="Precio por hora"
                  required
                  placeholder="0.00"
                  min={0}
                  step={100}
                  value={precioPorHora}
                  onChange={(value) => setPrecioPorHora(Number(value) || 0)}
                  leftSection="$"
                />
              </SimpleGrid>
              <DateInput
                label="Semana"
                placeholder="Seleccionar semana"
                value={semanaSeleccionada}
                onChange={(value) => {
                  if (value) {
                    setSemanaSeleccionada(value as unknown as Date);
                  }
                }}
                locale="es"
                leftSection={<IconCalendar size={18} />}
              />
            </Stack>
          </Paper>

          {/* Tabla de horarios */}
          <Paper p="lg" withBorder className={styles.scheduleCard}>
            <div className={styles.scheduleHeader}>
              <div className={styles.scheduleTitleWrapper}>
                <IconClock size={24} className={styles.scheduleIcon} />
                <Title order={3}>Horarios de la Semana</Title>
              </div>
              <Group gap="xs" className={styles.toggleButtons}>
                <Button 
                  size="sm" 
                  variant="light" 
                  color="green"
                  onClick={() => toggleAll(true)}
                  disabled={allSelected}
                  className={styles.toggleButton}
                >
                  Seleccionar todos
                </Button>
                <Button 
                  size="sm" 
                  variant="light" 
                  color="red"
                  onClick={() => toggleAll(false)}
                  disabled={noneSelected}
                  className={styles.toggleButton}
                >
                  Deseleccionar todos
                </Button>
              </Group>
            </div>
            
            {/* Desktop: Tabla */}
            <div className={styles.tableWrapper}>
              <Table className={styles.scheduleTable}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th className={styles.tableHeader}>Incluir</Table.Th>
                    <Table.Th className={styles.tableHeader}>Día</Table.Th>
                    <Table.Th className={styles.tableHeader}>Hora Inicio</Table.Th>
                    <Table.Th className={styles.tableHeader}>Hora Fin</Table.Th>
                    <Table.Th className={styles.tableHeader}>Horas</Table.Th>
                    <Table.Th className={styles.tableHeader}>Subtotal</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {horarios.map((horario, index) => {
                    const subtotal = horario.horas * precioPorHora;
                    return (
                      <Table.Tr 
                        key={index} 
                        className={`${styles.tableRow} ${horario.incluir ? styles.tableRowActive : styles.tableRowInactive}`}
                      >
                        <Table.Td>
                          <Checkbox
                            checked={horario.incluir}
                            onChange={(e) => actualizarHorario(index, 'incluir', e.currentTarget.checked)}
                            color="fucsia"
                            size="md"
                          />
                        </Table.Td>
                        <Table.Td>
                          <div className={styles.dayCell}>
                            <Text fw={horario.incluir ? 700 : 500} size="md">
                              {horario.diaNombre}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {inicioSemana?.add(horario.dia, 'day').format('DD/MM')}
                            </Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <input
                            type="time"
                            value={horario.horaInicio}
                            onChange={(e) => actualizarHorario(index, 'horaInicio', e.target.value)}
                            disabled={!horario.incluir}
                            className={`${styles.timeInput} ${!horario.incluir ? styles.timeInputDisabled : ''}`}
                          />
                        </Table.Td>
                        <Table.Td>
                          <input
                            type="time"
                            value={horario.horaFin}
                            onChange={(e) => actualizarHorario(index, 'horaFin', e.target.value)}
                            disabled={!horario.incluir}
                            className={`${styles.timeInput} ${!horario.incluir ? styles.timeInputDisabled : ''}`}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Badge 
                            color={horario.incluir && horario.horas > 0 ? 'green' : 'gray'}
                            size="lg"
                            variant="light"
                          >
                            {horario.horas.toFixed(2)}h
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text 
                            fw={horario.incluir ? 700 : 500} 
                            size="md"
                            c={horario.incluir ? 'fucsia' : 'dimmed'}
                          >
                            ${subtotal.toFixed(2)}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>

            {/* Mobile: Cards */}
            <div className={styles.mobileCards}>
              {horarios.map((horario, index) => {
                const subtotal = horario.horas * precioPorHora;
                return (
                  <div
                    key={index}
                    className={`${styles.mobileCard} ${horario.incluir ? styles.mobileCardActive : styles.mobileCardInactive}`}
                    onClick={() => !horario.incluir && actualizarHorario(index, 'incluir', true)}
                  >
                    <div className={styles.mobileCardHeader}>
                      <div className={styles.mobileCardDay}>
                        <Checkbox
                          checked={horario.incluir}
                          onChange={(e) => {
                            e.stopPropagation();
                            actualizarHorario(index, 'incluir', e.currentTarget.checked);
                          }}
                          color="fucsia"
                          size="lg"
                          className={styles.mobileCheckbox}
                        />
                        <div className={styles.mobileDayInfo}>
                          <Text fw={horario.incluir ? 700 : 500} size="lg">
                            {horario.diaNombre}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {inicioSemana?.add(horario.dia, 'day').format('DD/MM')}
                          </Text>
                        </div>
                      </div>
                      <Badge 
                        color={horario.incluir && horario.horas > 0 ? 'green' : 'gray'}
                        size="lg"
                        variant="light"
                        className={styles.mobileHoursBadge}
                      >
                        {horario.horas.toFixed(2)}h
                      </Badge>
                    </div>
                    
                    {horario.incluir && (
                      <div className={styles.mobileCardBody}>
                        <div className={styles.mobileTimeInputs}>
                          <div className={styles.mobileTimeGroup}>
                            <Text size="xs" fw={500} c="dimmed" ta="center">
                              Hora Inicio
                            </Text>
                            <input
                              type="time"
                              value={horario.horaInicio}
                              onChange={(e) => {
                                e.stopPropagation();
                                actualizarHorario(index, 'horaInicio', e.target.value);
                              }}
                              className={styles.mobileTimeInput}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className={styles.mobileTimeGroup}>
                            <Text size="xs" fw={500} c="dimmed" ta="center">
                              Hora Fin
                            </Text>
                            <input
                              type="time"
                              value={horario.horaFin}
                              onChange={(e) => {
                                e.stopPropagation();
                                actualizarHorario(index, 'horaFin', e.target.value);
                              }}
                              className={styles.mobileTimeInput}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className={styles.mobileSubtotal}>
                          <Text size="xs" c="dimmed" fw={500}>Subtotal</Text>
                          <Text 
                            fw={700} 
                            size="lg"
                            c="fucsia"
                          >
                            ${subtotal.toFixed(2)}
                          </Text>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Paper>

          {/* Resumen y acción */}
          <Card shadow="sm" padding="xl" radius="md" withBorder className={styles.summaryCard}>
            <Stack gap="lg">
              <div className={styles.summaryHeader}>
                <IconCalculator size={28} className={styles.summaryIcon} />
                <Title order={3}>Resumen de Liquidación</Title>
              </div>
              
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <Text size="sm" c="dimmed" fw={500} mb={4}>Días a liquidar</Text>
                  <Text size="xl" fw={700} className={styles.summaryValue}>
                    {totales.diasTrabajados} día{totales.diasTrabajados !== 1 ? 's' : ''}
                  </Text>
                </div>
                <div className={styles.summaryItem}>
                  <Text size="sm" c="dimmed" fw={500} mb={4}>Total de horas</Text>
                  <Text size="xl" fw={700} c="cian" className={styles.summaryValue}>
                    {totales.totalHoras.toFixed(2)} horas
                  </Text>
                </div>
                <div className={styles.summaryItem}>
                  <Text size="sm" c="dimmed" fw={500} mb={4}>Total a liquidar</Text>
                  <Text size="xl" fw={700} c="fucsia" className={styles.summaryValue}>
                    ${totales.totalMonto.toFixed(2)}
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
                disabled={totales.diasTrabajados === 0 || !cuidadorId || !precioPorHora}
                className={styles.submitButton}
              >
                Liquidar
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </div>
  );
}
