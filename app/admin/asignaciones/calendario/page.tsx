'use client';

import { Container, Title, Paper, Stack, Group, Button, Text, Select, ActionIcon, Modal, Badge, NumberInput, Textarea, Checkbox } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconChevronLeft, IconChevronRight, IconPencil } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.locale('es');

interface Horario {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

interface Asignacion {
  id: string;
  cuidadorId: string;
  personaId: string;
  cuidadorNombre?: string;
  personaNombre?: string;
  precioPorHora: number;
  fechaInicio: string;
  fechaFin: string | null;
  horarios: Horario[];
  notas: string | null;
}

interface Cuidador {
  id: string;
  nombreCompleto: string;
}

interface Persona {
  id: string;
  nombreCompleto: string;
}

interface HorarioForm {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HORAS_DIA = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarioPage() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [semanaActual, setSemanaActual] = useState<Date>(new Date());
  const [cuidadorFiltro, setCuidadorFiltro] = useState<string>('');
  const [selectedAsignacion, setSelectedAsignacion] = useState<Asignacion | null>(null);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  const editForm = useForm({
    initialValues: {
      precioPorHora: 0,
      fechaInicio: new Date(),
      fechaFin: null as Date | null,
      horarios: DIAS_SEMANA.map((_, index) => ({
        diaSemana: index,
        horaInicio: '09:00',
        horaFin: '17:00',
        activo: false,
      })) as HorarioForm[],
      notas: '',
    },
  });

  const fetchAsignaciones = async () => {
    try {
      const response = await fetch('/api/v1/asignaciones?all=true');
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
    fetch('/api/v1/cuidadores?all=true')
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.data)) {
          setCuidadores(data.data);
        }
      })
      .catch(err => console.error('Error fetching cuidadores:', err));
    fetch('/api/v1/personas-asistidas?all=true')
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.data)) {
          setPersonas(data.data);
        }
      })
      .catch(err => console.error('Error fetching personas:', err));
  }, []);

  const inicioSemana = useMemo(() => dayjs(semanaActual).startOf('isoWeek'), [semanaActual]);
  const finSemana = useMemo(() => dayjs(semanaActual).endOf('isoWeek'), [semanaActual]);
  const diasSemana = useMemo(() => Array.from({ length: 7 }, (_, i) => inicioSemana.add(i, 'day')), [inicioSemana]);

  const asignacionesFiltradas = useMemo(() => {
    let filtradas = asignaciones.filter(a => {
      const inicio = dayjs(a.fechaInicio);
      const fin = a.fechaFin ? dayjs(a.fechaFin) : null;
      // Solo mostrar si la semana actual está dentro del rango de la asignación
      return inicio.isBefore(finSemana.add(1, 'day')) && (!fin || fin.isAfter(inicioSemana.subtract(1, 'day')));
    });

    if (cuidadorFiltro) {
      filtradas = filtradas.filter(a => a.cuidadorId === cuidadorFiltro);
    }

    return filtradas;
  }, [asignaciones, cuidadorFiltro, inicioSemana, finSemana]);

  // Verificar si un día específico de la semana está dentro del rango de fechas de la asignación
  const esDiaValido = (asignacion: Asignacion, diaIndex: number) => {
    const fechaDia = inicioSemana.add(diaIndex, 'day');
    const fechaInicio = dayjs(asignacion.fechaInicio);
    const fechaFin = asignacion.fechaFin ? dayjs(asignacion.fechaFin) : null;
    
    // El día debe ser >= fecha inicio
    if (fechaDia.isBefore(fechaInicio, 'day')) return false;
    // Si hay fecha fin, el día debe ser <= fecha fin
    if (fechaFin && fechaDia.isAfter(fechaFin, 'day')) return false;
    
    return true;
  };

  const obtenerAsignacionesPorDia = (diaSemana: number) => {
    return asignacionesFiltradas.filter(a => {
      if (!Array.isArray(a.horarios)) return false;
      // Verificar que el día esté dentro del rango de fechas
      if (!esDiaValido(a, diaSemana)) return false;
      return a.horarios.some((h: Horario) => h.diaSemana === diaSemana);
    });
  };

  const obtenerColor = (personaId: string) => {
    const index = personas.findIndex(p => p.id === personaId);
    const colores = ['#FF6B9D', '#00CED1', '#FFD700', '#FF8C69', '#9370DB', '#20B2AA', '#FF69B4'];
    return colores[index % colores.length];
  };

  const calcularAltura = (horaInicio: string, horaFin: string) => {
    const [h1, m1] = horaInicio.split(':').map(Number);
    const [h2, m2] = horaFin.split(':').map(Number);
    const minutos = (h2 * 60 + m2) - (h1 * 60 + m1);
    return (minutos / 60) * 60; // 60px por hora
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

  const handleEdit = (asignacion: Asignacion) => {
    setSelectedAsignacion(asignacion);
    
    const horariosForm = DIAS_SEMANA.map((_, index) => {
      const horarioExistente = asignacion.horarios.find(h => h.diaSemana === index);
      return {
        diaSemana: index,
        horaInicio: horarioExistente?.horaInicio || '09:00',
        horaFin: horarioExistente?.horaFin || '17:00',
        activo: !!horarioExistente,
      };
    });

    editForm.setValues({
      precioPorHora: asignacion.precioPorHora,
      fechaInicio: new Date(asignacion.fechaInicio),
      fechaFin: asignacion.fechaFin ? new Date(asignacion.fechaFin) : null,
      horarios: horariosForm,
      notas: asignacion.notas || '',
    });
    
    closeView();
    openEdit();
  };

  const handleEditSubmit = async (values: typeof editForm.values) => {
    if (!selectedAsignacion) return;

    try {
      const horariosActivos = values.horarios
        .filter(h => h.activo)
        .map(h => ({
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
        }));

      if (horariosActivos.length === 0) {
        notifications.show({
          title: 'Error',
          message: 'Seleccioná al menos un día con horarios',
          color: 'red',
        });
        return;
      }

      const fechaInicio = values.fechaInicio instanceof Date 
        ? values.fechaInicio 
        : new Date(values.fechaInicio);
      
      const fechaFin = values.fechaFin 
        ? (values.fechaFin instanceof Date ? values.fechaFin : new Date(values.fechaFin))
        : null;

      const response = await fetch(`/api/v1/asignaciones/${selectedAsignacion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          precioPorHora: values.precioPorHora,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin ? fechaFin.toISOString() : null,
          horarios: horariosActivos,
          notas: values.notas || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || 'Error al actualizar asignación');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Asignación actualizada correctamente',
        color: 'green',
      });

      closeEdit();
      fetchAsignaciones();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    }
  };

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

      <Paper p="md" withBorder>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
            <thead>
              <tr>
                <th style={{ width: '100px', padding: '8px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  Hora
                </th>
                {diasSemana.map((dia, index) => (
                  <th
                    key={index}
                    style={{
                      padding: '8px',
                      textAlign: 'center',
                      borderBottom: '2px solid #dee2e6',
                      backgroundColor: dia.isSame(dayjs(), 'day') ? '#fff3cd' : 'transparent',
                    }}
                  >
                    <Text fw={600}>{DIAS_SEMANA[index]}</Text>
                    <Text size="xs" c="dimmed">
                      {dia.format('DD/MM')}
                    </Text>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HORAS_DIA.map((hora) => (
                <tr key={hora}>
                  <td
                    style={{
                      padding: '4px 8px',
                      borderRight: '1px solid #dee2e6',
                      fontSize: '12px',
                      color: '#666',
                    }}
                  >
                    {hora.toString().padStart(2, '0')}:00
                  </td>
                  {diasSemana.map((dia, diaIndex) => {
                    const asignacionesDia = obtenerAsignacionesPorDia(diaIndex).filter(a => {
                      if (!Array.isArray(a.horarios)) return false;
                      const horario = a.horarios.find((h: Horario) => h.diaSemana === diaIndex);
                      if (!horario) return false;
                      const [hInicio] = horario.horaInicio.split(':').map(Number);
                      return hInicio === hora;
                    });

                    return (
                      <td
                        key={diaIndex}
                        style={{
                          padding: '2px',
                          borderRight: '1px solid #dee2e6',
                          borderBottom: '1px solid #e9ecef',
                          position: 'relative',
                          height: '60px',
                          backgroundColor: dia.isSame(dayjs(), 'day') ? '#fff3cd' : 'transparent',
                        }}
                      >
                        {asignacionesDia.map((asignacion) => {
                          const horario = asignacion.horarios.find((h: Horario) => h.diaSemana === diaIndex);
                          if (!horario) return null;

                          const color = obtenerColor(asignacion.personaId);
                          const altura = calcularAltura(horario.horaInicio, horario.horaFin);

                          return (
                            <div
                              key={asignacion.id}
                              onClick={() => handleClickAsignacion(asignacion)}
                              style={{
                                position: 'absolute',
                                top: '0',
                                left: '2px',
                                right: '2px',
                                height: `${altura}px`,
                                backgroundColor: color,
                                color: 'white',
                                padding: '4px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                overflow: 'hidden',
                                zIndex: 1,
                                cursor: 'pointer',
                              }}
                              title={`${asignacion.cuidadorNombre || ''} → ${asignacion.personaNombre || ''}\n${horario.horaInicio} - ${horario.horaFin}`}
                            >
                              <Text size="xs" fw={600} truncate>
                                {asignacion.personaNombre || asignacion.personaId}
                              </Text>
                              <Text size="xs" truncate>
                                {horario.horaInicio} - {horario.horaFin}
                              </Text>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Paper>

      {asignacionesFiltradas.length > 0 && (
        <Paper p="md" withBorder mt="xl">
          <Text fw={600} mb="md">Leyenda</Text>
          <Group gap="md">
            {Array.from(new Set(asignacionesFiltradas.map(a => a.personaId))).map((personaId) => {
              const persona = personas.find(p => p.id === personaId);
              const asignacion = asignacionesFiltradas.find(a => a.personaId === personaId);
              return (
                <Group key={personaId} gap="xs">
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: obtenerColor(personaId),
                      borderRadius: '4px',
                    }}
                  />
                  <Text size="sm">{persona?.nombreCompleto || asignacion?.personaNombre || personaId}</Text>
                </Group>
              );
            })}
          </Group>
        </Paper>
      )}

      {/* Modal Ver Asignación */}
      <Modal opened={viewOpened} onClose={closeView} title="Detalle de Asignación" size="lg">
        {selectedAsignacion && (
          <Stack gap="md">
            <Group>
              <Text fw={600}>Cuidador:</Text>
              <Text>{selectedAsignacion.cuidadorNombre || selectedAsignacion.cuidadorId}</Text>
            </Group>
            <Group>
              <Text fw={600}>Persona Asistida:</Text>
              <Text>{selectedAsignacion.personaNombre || selectedAsignacion.personaId}</Text>
            </Group>
            <Group>
              <Text fw={600}>Precio por hora:</Text>
              <Text>${selectedAsignacion.precioPorHora.toLocaleString()}</Text>
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
            <Stack gap="xs">
              <Text fw={600}>Horarios:</Text>
              <Group gap="xs">
                {selectedAsignacion.horarios.map((h, idx) => (
                  <Badge key={idx} size="lg" variant="light">
                    {DIAS_SEMANA[h.diaSemana]}: {h.horaInicio} - {h.horaFin}
                  </Badge>
                ))}
              </Group>
            </Stack>
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
              <Button color="yellow" leftSection={<IconPencil size={16} />} onClick={() => handleEdit(selectedAsignacion)}>
                Editar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Modal Editar Asignación */}
      <Modal opened={editOpened} onClose={closeEdit} title="Editar Asignación" size="lg">
        <form onSubmit={editForm.onSubmit(handleEditSubmit)}>
          <Stack>
            {selectedAsignacion && (
              <Paper p="sm" withBorder bg="gray.0">
                <Group>
                  <Text size="sm" fw={600}>{selectedAsignacion.cuidadorNombre}</Text>
                  <Badge size="sm" color="fucsia">→</Badge>
                  <Text size="sm">{selectedAsignacion.personaNombre}</Text>
                </Group>
              </Paper>
            )}
            <NumberInput
              label="Precio por hora"
              required
              min={0}
              leftSection="$"
              {...editForm.getInputProps('precioPorHora')}
            />
            <DateInput label="Fecha Inicio" required locale="es" {...editForm.getInputProps('fechaInicio')} />
            <DateInput label="Fecha Fin (opcional)" locale="es" {...editForm.getInputProps('fechaFin')} />

            <Paper p="md" withBorder>
              <Text fw={600} mb="md">Horarios Semanales</Text>
              <Stack gap="sm">
                {editForm.values.horarios.map((horario, index) => (
                  <Group key={index} grow>
                    <Checkbox
                      label={DIAS_SEMANA[horario.diaSemana]}
                      {...editForm.getInputProps(`horarios.${index}.activo`, { type: 'checkbox' })}
                    />
                    <input
                      type="time"
                      value={horario.horaInicio}
                      onChange={(e) => editForm.setFieldValue(`horarios.${index}.horaInicio`, e.target.value)}
                      disabled={!horario.activo}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        opacity: horario.activo ? 1 : 0.5,
                      }}
                    />
                    <input
                      type="time"
                      value={horario.horaFin}
                      onChange={(e) => editForm.setFieldValue(`horarios.${index}.horaFin`, e.target.value)}
                      disabled={!horario.activo}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        opacity: horario.activo ? 1 : 0.5,
                      }}
                    />
                  </Group>
                ))}
              </Stack>
            </Paper>

            <Textarea label="Notas" {...editForm.getInputProps('notas')} />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeEdit}>
                Cancelar
              </Button>
              <Button type="submit" color="fucsia">
                Guardar Cambios
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
