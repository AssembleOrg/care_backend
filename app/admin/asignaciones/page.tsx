'use client';

import { Container, Title, Button, Modal, Stack, Group, Select, NumberInput, Textarea, Badge, Paper, Text, ActionIcon, Checkbox, Pagination } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconCalendar, IconEye, IconPencil, IconFilter, IconX } from '@tabler/icons-react';
import Link from 'next/link';
import { useDebouncedValue } from '@mantine/hooks';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { extractApiErrorMessage, parseApiError } from '../utils/parseApiError';
import styles from './asignaciones.module.css';

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

interface PaginatedResponse {
  data: Asignacion[];
  total: number;
  page: number;
  limit: number;
}

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [cuidadorFiltro, setCuidadorFiltro] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

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

  const fetchAsignaciones = async (currentPage: number = page) => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
      });
      
      // Agregar filtro de cuidador si existe
      if (cuidadorFiltro) {
        params.set('cuidadorId', cuidadorFiltro);
      }
      
      const response = await fetch(`/api/v1/asignaciones?${params}`);
      const data = await response.json();
      if (data.ok) {
        const result = data.data as PaginatedResponse;
        setAsignaciones(result.data);
        setTotal(result.total);
        setPage(result.page);
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
    setPage(1);
    fetchAsignaciones(1);
  }, [cuidadorFiltro]);

  useEffect(() => {
    fetchAsignaciones(1);
    // Cargar cuidadores para el filtro
    fetch('/api/v1/cuidadores?all=true')
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.data)) {
          setCuidadores(data.data);
        }
      })
      .catch(err => console.error('Error fetching cuidadores:', err));
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchAsignaciones(newPage);
  };

  const totalPages = useMemo(() => Math.ceil(total / 20), [total]);

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
    if (!values.cuidadorId || !values.personaId) {
      notifications.show({
        title: 'Error',
        message: 'Seleccioná un cuidador y una persona asistida',
        color: 'red',
      });
      return;
    }

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

    setSubmitting(true);
    try {
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
        throw new Error(extractApiErrorMessage(data) || 'Error al crear asignación');
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
      fetchAsignaciones(page);
    } catch (error: unknown) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string, nombre: string) => {
    setItemToDelete({ id, name: nombre });
    openDeleteModal();
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleting(itemToDelete.id);
    try {
      const response = await fetch(`/api/v1/asignaciones/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(extractApiErrorMessage(data) || 'Error al eliminar asignación');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Asignación eliminada correctamente',
        color: 'green',
      });

      closeDeleteModal();
      setItemToDelete(null);
      fetchAsignaciones(page);
    } catch (error: unknown) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error desconocido',
        color: 'red',
      });
    } finally {
      setDeleting(null);
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

    setUpdating(true);
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
        setUpdating(false);
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
      fetchAsignaciones(page);
    } catch (error: unknown) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Asignaciones</Title>
        <Group>
          <Button 
            leftSection={<IconFilter size={16} />} 
            variant={showFilters ? 'filled' : 'light'}
            color="cian"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros {cuidadorFiltro && '(1)'}
          </Button>
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

      {/* Panel de Filtros */}
      {showFilters && (
        <Paper p="md" withBorder mb="xl">
          <Group justify="space-between" mb="md">
            <Text fw={600}>Filtros</Text>
            {cuidadorFiltro && (
              <Button 
                size="xs" 
                variant="subtle" 
                color="red" 
                leftSection={<IconX size={14} />}
                onClick={() => {
                  setCuidadorFiltro('');
                  setPage(1);
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </Group>
          <Select
            label="Filtrar por cuidador"
            placeholder="Todos los cuidadores"
            clearable
            searchable
            data={cuidadores.map(c => ({ value: c.id, label: c.nombreCompleto }))}
            value={cuidadorFiltro}
            onChange={(value) => {
              setCuidadorFiltro(value || '');
              setPage(1);
            }}
            style={{ flex: 1 }}
          />
        </Paper>
      )}

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
                <ActionIcon 
                  color="yellow" 
                  variant="light" 
                  onClick={() => handleEdit(asignacion)}
                  disabled={deleting === asignacion.id}
                >
                  <IconPencil size={16} />
                </ActionIcon>
                <ActionIcon 
                  color="red" 
                  variant="light" 
                  onClick={() => handleDeleteClick(asignacion.id, `${asignacion.cuidadorNombre || ''} → ${asignacion.personaNombre || ''}`)}
                  loading={deleting === asignacion.id}
                  disabled={deleting === asignacion.id}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>

      <Group justify="center" mt="xl">
        <Pagination value={page} onChange={handlePageChange} total={Math.max(totalPages, 1)} />
      </Group>

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

            <Paper p="md" withBorder style={{ overflow: 'hidden' }}>
              <Text fw={600} mb="md">Horarios Semanales</Text>
              <Stack gap="sm">
                {form.values.horarios.map((horario, index) => (
                  <Group 
                    key={index} 
                    gap="xs" 
                    wrap="nowrap" 
                    className={styles.timeInputGroup}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <Checkbox
                      label={DIAS_SEMANA[horario.diaSemana]}
                      {...form.getInputProps(`horarios.${index}.activo`, { type: 'checkbox' })}
                      style={{ flexShrink: 1, minWidth: '100px', maxWidth: '120px' }}
                    />
                    <input
                      type="time"
                      value={horario.horaInicio}
                      onChange={(e) => form.setFieldValue(`horarios.${index}.horaInicio`, e.target.value)}
                      disabled={!horario.activo}
                      className={styles.timeInput}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '16px',
                        flex: '1 1 0',
                        minWidth: '110px',
                        width: '100%',
                        opacity: horario.activo ? 1 : 0.5,
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="time"
                      value={horario.horaFin}
                      onChange={(e) => form.setFieldValue(`horarios.${index}.horaFin`, e.target.value)}
                      disabled={!horario.activo}
                      className={styles.timeInput}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '16px',
                        flex: '1 1 0',
                        minWidth: '110px',
                        width: '100%',
                        opacity: horario.activo ? 1 : 0.5,
                        boxSizing: 'border-box',
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
              <Button type="submit" color="fucsia" loading={submitting} disabled={submitting}>
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

            <Paper p="md" withBorder style={{ overflow: 'hidden' }}>
              <Text fw={600} mb="md">Horarios Semanales</Text>
              <Stack gap="sm">
                {editForm.values.horarios.map((horario, index) => (
                  <Group 
                    key={index} 
                    gap="xs" 
                    wrap="nowrap" 
                    className={styles.timeInputGroup}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <Checkbox
                      label={DIAS_SEMANA[horario.diaSemana]}
                      {...editForm.getInputProps(`horarios.${index}.activo`, { type: 'checkbox' })}
                      style={{ flexShrink: 1, minWidth: '100px', maxWidth: '120px' }}
                    />
                    <input
                      type="time"
                      value={horario.horaInicio}
                      onChange={(e) => editForm.setFieldValue(`horarios.${index}.horaInicio`, e.target.value)}
                      disabled={!horario.activo}
                      className={styles.timeInput}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '16px',
                        flex: '1 1 0',
                        minWidth: '110px',
                        width: '100%',
                        opacity: horario.activo ? 1 : 0.5,
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="time"
                      value={horario.horaFin}
                      onChange={(e) => editForm.setFieldValue(`horarios.${index}.horaFin`, e.target.value)}
                      disabled={!horario.activo}
                      className={styles.timeInput}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '16px',
                        flex: '1 1 0',
                        minWidth: '110px',
                        width: '100%',
                        opacity: horario.activo ? 1 : 0.5,
                        boxSizing: 'border-box',
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
              <Button type="submit" color="fucsia" loading={updating} disabled={updating}>
                Guardar Cambios
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <ConfirmDeleteModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Asignación"
        message="¿Estás seguro de que deseas eliminar esta asignación?"
        itemName={itemToDelete?.name}
        loading={deleting !== null}
      />
    </Container>
  );
}
