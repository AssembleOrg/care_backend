'use client';

import { Container, Title, Button, Modal, Stack, Group, Select, NumberInput, Textarea, Badge, Paper, Text, ActionIcon, Checkbox } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconCalendar, IconEye, IconPencil } from '@tabler/icons-react';
import Link from 'next/link';
import { useDebouncedValue } from '@mantine/hooks';

interface Asignacion {
  id: string;
  cuidadorId: string;
  personaId: string;
  cuidadorNombre?: string;
  personaNombre?: string;
  precioPorHora: number;
  fechaInicio: string;
  fechaFin: string | null;
  horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string }>;
  notas: string | null;
}

interface HorarioForm {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function AsignacionesPage() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [selectedAsignacion, setSelectedAsignacion] = useState<Asignacion | null>(null);
  const [cuidadores, setCuidadores] = useState<Array<{ id: string; nombreCompleto: string }>>([]);
  const [personas, setPersonas] = useState<Array<{ id: string; nombreCompleto: string }>>([]);
  const [cuidadorSearch, setCuidadorSearch] = useState('');
  const [personaSearch, setPersonaSearch] = useState('');
  const [debouncedCuidadorSearch] = useDebouncedValue(cuidadorSearch, 300);
  const [debouncedPersonaSearch] = useDebouncedValue(personaSearch, 300);

  const form = useForm({
    initialValues: {
      cuidadorId: '',
      personaId: '',
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
      if (data.ok) {
        setAsignaciones(data.data);
      }
    } catch (error: unknown) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error desconocido',
        color: 'red',
      });
    }
  };

  useEffect(() => {
    fetchAsignaciones();
  }, []);

  // Resetear búsquedas cuando se cierra el modal
  useEffect(() => {
    if (!opened) {
      setCuidadorSearch('');
      setPersonaSearch('');
      setCuidadores([]);
      setPersonas([]);
    }
  }, [opened]);

  // Buscar cuidadores cuando cambia el término de búsqueda (solo si hay 2+ caracteres)
  useEffect(() => {
    if (!opened) return;
    
    if (debouncedCuidadorSearch.length > 0 && debouncedCuidadorSearch.length < 2) {
      setCuidadores([]);
      return;
    }
    
    if (debouncedCuidadorSearch.length < 2) {
      return;
    }
    
    const fetchCuidadores = async () => {
      try {
        const params = new URLSearchParams({ all: 'true', search: debouncedCuidadorSearch });
        const response = await fetch(`/api/v1/cuidadores?${params}`);
        const data = await response.json();
        if (data.ok && Array.isArray(data.data)) {
          setCuidadores(data.data);
        }
      } catch (err) {
        console.error('Error fetching cuidadores:', err);
      }
    };

    fetchCuidadores();
  }, [debouncedCuidadorSearch, opened]);

  // Buscar personas cuando cambia el término de búsqueda (solo si hay 2+ caracteres)
  useEffect(() => {
    if (!opened) return;
    
    if (debouncedPersonaSearch.length > 0 && debouncedPersonaSearch.length < 2) {
      setPersonas([]);
      return;
    }
    
    if (debouncedPersonaSearch.length < 2) {
      return;
    }
    
    const fetchPersonas = async () => {
      try {
        const params = new URLSearchParams({ all: 'true', search: debouncedPersonaSearch });
        const response = await fetch(`/api/v1/personas-asistidas?${params}`);
        const data = await response.json();
        if (data.ok && Array.isArray(data.data)) {
          setPersonas(data.data);
        }
      } catch (err) {
        console.error('Error fetching personas:', err);
      }
    };

    fetchPersonas();
  }, [debouncedPersonaSearch, opened]);

  const handleSubmit = async (values: typeof form.values) => {
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

      const response = await fetch('/api/v1/asignaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuidadorId: values.cuidadorId,
          personaId: values.personaId,
          precioPorHora: values.precioPorHora,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin ? fechaFin.toISOString() : undefined,
          horarios: horariosActivos,
          notas: values.notas || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || 'Error al crear asignación');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Asignación creada correctamente',
        color: 'green',
      });

      form.reset();
      setCuidadorSearch('');
      setPersonaSearch('');
      close();
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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta asignación?')) return;

    try {
      const response = await fetch(`/api/v1/asignaciones/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || 'Error al eliminar asignación');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Asignación eliminada correctamente',
        color: 'green',
      });

      fetchAsignaciones();
    } catch (error: unknown) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error desconocido',
        color: 'red',
      });
    }
  };

  const handleView = (asignacion: Asignacion) => {
    setSelectedAsignacion(asignacion);
    openView();
  };

  const handleEdit = (asignacion: Asignacion) => {
    setSelectedAsignacion(asignacion);
    
    // Preparar horarios para el form
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
        <Title order={1}>Asignaciones</Title>
        <Group>
          <Button
            component={Link}
            href="/admin/asignaciones/calendario"
            leftSection={<IconCalendar size={16} />}
            variant="light"
            color="cian"
          >
            Ver Calendario
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={open} color="fucsia">
            Nueva Asignación
          </Button>
        </Group>
      </Group>

      <Stack gap="md">
        {asignaciones.map((asignacion) => (
          <Paper key={asignacion.id} p="md" withBorder>
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs" style={{ flex: 1 }}>
                <Group>
                  <Text fw={600}>{asignacion.cuidadorNombre || asignacion.cuidadorId}</Text>
                  <Badge color="fucsia">→</Badge>
                  <Text>{asignacion.personaNombre || asignacion.personaId}</Text>
                </Group>
                <Text size="sm" c="dimmed">
                  Precio por hora: ${asignacion.precioPorHora.toLocaleString()}
                </Text>
                <Text size="sm" c="dimmed">
                  Desde: {new Date(asignacion.fechaInicio).toLocaleDateString('es-AR')}
                  {asignacion.fechaFin && ` hasta ${new Date(asignacion.fechaFin).toLocaleDateString('es-AR')}`}
                </Text>
                <Group gap="xs">
                  {Array.isArray(asignacion.horarios) && asignacion.horarios.map((h: { diaSemana: number; horaInicio: string; horaFin: string }, idx: number) => (
                    <Badge key={idx} size="sm" variant="light">
                      {DIAS_SEMANA[h.diaSemana]}: {h.horaInicio} - {h.horaFin}
                    </Badge>
                  ))}
                </Group>
                {asignacion.notas && (
                  <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
                    {asignacion.notas}
                  </Text>
                )}
              </Stack>
              <Group gap="xs">
                <ActionIcon color="blue" variant="light" onClick={() => handleView(asignacion)}>
                  <IconEye size={16} />
                </ActionIcon>
                <ActionIcon color="yellow" variant="light" onClick={() => handleEdit(asignacion)}>
                  <IconPencil size={16} />
                </ActionIcon>
                <ActionIcon color="red" variant="light" onClick={() => handleDelete(asignacion.id)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>

      {/* Modal Nueva Asignación */}
      <Modal opened={opened} onClose={close} title="Nueva Asignación" size="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Cuidador"
              required
              searchable
              data={cuidadores.map(c => ({ value: c.id, label: c.nombreCompleto }))}
              searchValue={cuidadorSearch}
              onSearchChange={setCuidadorSearch}
              {...form.getInputProps('cuidadorId')}
              placeholder="Buscar por nombre (mínimo 2 letras)..."
            />
            <Select
              label="Persona Asistida"
              required
              searchable
              data={personas.map(p => ({ value: p.id, label: p.nombreCompleto }))}
              searchValue={personaSearch}
              onSearchChange={setPersonaSearch}
              {...form.getInputProps('personaId')}
              placeholder="Buscar por nombre (mínimo 2 letras)..."
            />
            <NumberInput
              label="Precio por hora"
              required
              min={0}
              leftSection="$"
              {...form.getInputProps('precioPorHora')}
            />
            <DateInput label="Fecha Inicio" required locale="es" {...form.getInputProps('fechaInicio')} />
            <DateInput label="Fecha Fin (opcional)" locale="es" {...form.getInputProps('fechaFin')} />

            <Paper p="md" withBorder>
              <Text fw={600} mb="md">Horarios Semanales</Text>
              <Stack gap="sm">
                {form.values.horarios.map((horario, index) => (
                  <Group key={index} grow>
                    <Checkbox
                      label={DIAS_SEMANA[horario.diaSemana]}
                      {...form.getInputProps(`horarios.${index}.activo`, { type: 'checkbox' })}
                    />
                    <input
                      type="time"
                      value={horario.horaInicio}
                      onChange={(e) => form.setFieldValue(`horarios.${index}.horaInicio`, e.target.value)}
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
                      onChange={(e) => form.setFieldValue(`horarios.${index}.horaFin`, e.target.value)}
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

            <Textarea label="Notas" {...form.getInputProps('notas')} />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={close}>
                Cancelar
              </Button>
              <Button type="submit" color="fucsia">
                Crear
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

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
              <Button color="yellow" onClick={() => { closeView(); handleEdit(selectedAsignacion); }}>
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
