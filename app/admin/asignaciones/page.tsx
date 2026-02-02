'use client';

import { Container, Title, Button, Modal, Stack, Group, Select, NumberInput, Textarea, Badge, Paper, Text, ActionIcon, Pagination, MultiSelect, SimpleGrid } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconCalendar, IconEye, IconPencil, IconFilter, IconX, IconBolt, IconCalculator, IconCurrencyDollar, IconFileText } from '@tabler/icons-react';
import Link from 'next/link';
import { useDebouncedValue } from '@mantine/hooks';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { extractApiErrorMessage, parseApiError } from '../utils/parseApiError';

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
  horarios: Array<{ diaSemana: number }> | null;
  horasPorCuidador: Record<string, CuidadorAsignacion> | null;
  notas: string | null;
}


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
  const [cuidadoresFiltrados, setCuidadoresFiltrados] = useState<Array<{ id: string; nombreCompleto: string }>>([]);
  const [personas, setPersonas] = useState<Array<{ id: string; nombreCompleto: string }>>([]);
  const [personaSearch, setPersonaSearch] = useState('');
  const [cuidadorSearch, setCuidadorSearch] = useState('');
  const [debouncedPersonaSearch] = useDebouncedValue(personaSearch, 300);
  const [debouncedCuidadorSearch] = useDebouncedValue(cuidadorSearch, 300);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [cuidadorFiltro, setCuidadorFiltro] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Liquidación rápida
  const [selectedRapidaAsignacion, setSelectedRapidaAsignacion] = useState<Asignacion | null>(null);
  const [selectedRapidaCuidadorId, setSelectedRapidaCuidadorId] = useState<string>('');
  const [rapidaHorasTrabajadas, setRapidaHorasTrabajadas] = useState<number>(0);
  const [rapidaPrecioPorHora, setRapidaPrecioPorHora] = useState<number>(0);
  const [rapidaOpened, { open: openRapida, close: closeRapida }] = useDisclosure(false);
  const [liquidando, setLiquidando] = useState(false);
  
  // Comprobantes
  const [comprobantesOpened, { open: openComprobantes, close: closeComprobantes }] = useDisclosure(false);
  const [comprobantes, setComprobantes] = useState<Array<{ id: string; fecha: string; monto: number; horasTrabajadas?: number; precioPorHora?: number }>>([]);
  const [asignacionComprobantes, setAsignacionComprobantes] = useState<Asignacion | null>(null);

  const form = useForm({
    initialValues: {
      cuidadoresIds: [] as string[],
      personaId: '',
      fechaInicio: new Date(),
      fechaFin: null as Date | null,
      horasPorCuidador: {} as Record<string, CuidadorAsignacion>,
      notas: '',
    },
  });

  const editForm = useForm({
    initialValues: {
      cuidadoresIds: [] as string[],
      fechaInicio: new Date(),
      fechaFin: null as Date | null,
      horasPorCuidador: {} as Record<string, CuidadorAsignacion>,
      notas: '',
    },
  });

  // Calcular total de horas trabajadas
  const totalHorasTrabajadas = useMemo(() => {
    const datos = form.values.horasPorCuidador || {};
    return Object.values(datos).reduce((sum, data) => sum + (data?.horas || 0), 0);
  }, [form.values.horasPorCuidador]);

  // Calcular total de monto
  const totalMonto = useMemo(() => {
    const datos = form.values.horasPorCuidador || {};
    return Object.values(datos).reduce((sum, data) => {
      const horas = data?.horas || 0;
      const precio = data?.precioPorHora || 0;
      return sum + (horas * precio);
    }, 0);
  }, [form.values.horasPorCuidador]);

  const totalHorasTrabajadasEdit = useMemo(() => {
    const datos = editForm.values.horasPorCuidador || {};
    return Object.values(datos).reduce((sum, data) => sum + (data?.horas || 0), 0);
  }, [editForm.values.horasPorCuidador]);

  // Calcular total de monto (edición)
  const totalMontoEdit = useMemo(() => {
    const datos = editForm.values.horasPorCuidador || {};
    return Object.values(datos).reduce((sum, data) => {
      const horas = data?.horas || 0;
      const precio = data?.precioPorHora || 0;
      return sum + (horas * precio);
    }, 0);
  }, [editForm.values.horasPorCuidador]);

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
          setCuidadoresFiltrados(data.data); // Inicializar con todos los cuidadores
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
      setPersonaSearch('');
      setCuidadorSearch('');
      setPersonas([]);
      setCuidadoresFiltrados(cuidadores); // Restaurar lista completa
      form.reset();
    }
  }, [opened, cuidadores]);

  // Buscar cuidadores cuando cambia el término de búsqueda (solo si hay 2+ caracteres)
  useEffect(() => {
    if (!opened) return;
    
    if (debouncedCuidadorSearch.length === 0) {
      setCuidadoresFiltrados(cuidadores);
      return;
    }
    
    if (debouncedCuidadorSearch.length < 2) {
      setCuidadoresFiltrados([]);
      return;
    }
    
    const fetchCuidadores = async () => {
      try {
        const params = new URLSearchParams({ all: 'true', search: debouncedCuidadorSearch });
        const response = await fetch(`/api/v1/cuidadores?${params}`);
        const data = await response.json();
        if (data.ok && Array.isArray(data.data)) {
          setCuidadoresFiltrados(data.data);
        }
      } catch (err) {
        console.error('Error fetching cuidadores:', err);
      }
    };

    fetchCuidadores();
  }, [debouncedCuidadorSearch, opened, cuidadores]);

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

  const handleLiquidacionRapida = (asignacion: Asignacion) => {
    setSelectedRapidaAsignacion(asignacion);
    
    // Si hay un solo cuidador, asignarlo automáticamente
    if (asignacion.cuidadoresIds.length === 1) {
      const cuidadorId = asignacion.cuidadoresIds[0];
      const data = asignacion.horasPorCuidador?.[cuidadorId];
      setSelectedRapidaCuidadorId(cuidadorId);
      // Establecer valores inmediatamente - usar valores por defecto si no hay data
      setRapidaHorasTrabajadas(data?.horas || 0);
      setRapidaPrecioPorHora(data?.precioPorHora || 0);
    } else {
      setSelectedRapidaCuidadorId('');
      setRapidaHorasTrabajadas(0);
      setRapidaPrecioPorHora(0);
    }
    
    openRapida();
  };

  // Actualizar horas y precio cuando cambia el cuidador seleccionado (solo para múltiples cuidadores)
  useEffect(() => {
    // Solo actualizar si hay múltiples cuidadores y el usuario cambia la selección
    if (selectedRapidaCuidadorId && selectedRapidaAsignacion && rapidaOpened && selectedRapidaAsignacion.cuidadoresIds.length > 1) {
      const data = selectedRapidaAsignacion.horasPorCuidador?.[selectedRapidaCuidadorId];
      if (data) {
        setRapidaHorasTrabajadas(data.horas);
        setRapidaPrecioPorHora(data.precioPorHora);
      } else {
        setRapidaHorasTrabajadas(0);
        setRapidaPrecioPorHora(0);
      }
    }
  }, [selectedRapidaCuidadorId, selectedRapidaAsignacion, rapidaOpened]);

  const handleVerComprobantes = async (asignacion: Asignacion) => {
    setAsignacionComprobantes(asignacion);
    try {
      const response = await fetch(`/api/v1/liquidaciones?asignacionId=${asignacion.id}&all=true`);
      const data = await response.json();
      if (data.ok && Array.isArray(data.data)) {
        setComprobantes(data.data);
      } else {
        setComprobantes([]);
      }
    } catch (error) {
      console.error('Error fetching comprobantes:', error);
      setComprobantes([]);
    }
    openComprobantes();
  };

  const handleUsarDatosLiquidacion = async () => {
    if (!selectedRapidaCuidadorId || !selectedRapidaAsignacion || !rapidaHorasTrabajadas || rapidaHorasTrabajadas <= 0 || !rapidaPrecioPorHora || rapidaPrecioPorHora <= 0) {
      notifications.show({
        title: 'Error',
        message: 'Completá todos los campos requeridos',
        color: 'red',
      });
      return;
    }

    setLiquidando(true);
    try {
      const fechaInicioDate = new Date(selectedRapidaAsignacion.fechaInicio);
      const fechaFinDate = selectedRapidaAsignacion.fechaFin 
        ? new Date(selectedRapidaAsignacion.fechaFin) 
        : new Date();

      const monto = rapidaHorasTrabajadas * rapidaPrecioPorHora;

      const response = await fetch('/api/v1/liquidaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuidadorId: selectedRapidaCuidadorId,
          precioPorHora: rapidaPrecioPorHora,
          fechaInicio: fechaInicioDate.toISOString(),
          fechaFin: fechaFinDate.toISOString(),
          horasTrabajadas: rapidaHorasTrabajadas,
          monto: monto,
          asignacionId: selectedRapidaAsignacion.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error?.message || 'Error al liquidar');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Liquidación creada correctamente',
        color: 'green',
      });

      // Generar y descargar comprobante
      if (result.data?.id) {
        try {
          const pdfResponse = await fetch(`/api/v1/liquidaciones/${result.data.id}/recibo.pdf`);
          if (pdfResponse.ok) {
            const blob = await pdfResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `liquidacion-${result.data.id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
          }
        } catch (pdfError) {
          console.error('Error al generar PDF:', pdfError);
          // No mostramos error si falla el PDF, la liquidación ya se creó
        }
      }

      // Cerrar modal y refrescar asignaciones
      closeRapida();
      setSelectedRapidaAsignacion(null);
      setSelectedRapidaCuidadorId('');
      setRapidaHorasTrabajadas(0);
      setRapidaPrecioPorHora(0);
      fetchAsignaciones(page);
    } catch (error: unknown) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setLiquidando(false);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.personaId || !values.cuidadoresIds || values.cuidadoresIds.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Seleccioná una persona asistida y al menos un cuidador',
        color: 'red',
      });
      return;
    }

    // Validar que todos los cuidadores tengan horas y precio por hora asignados
    const horasPorCuidador: Record<string, CuidadorAsignacion> = {};
    for (const cuidadorId of values.cuidadoresIds) {
      const data = values.horasPorCuidador[cuidadorId];
      if (!data || data.horas <= 0 || data.precioPorHora <= 0) {
        notifications.show({
          title: 'Error',
          message: `Ingresá las horas y precio por hora para todos los cuidadores seleccionados`,
          color: 'red',
        });
        return;
      }
      horasPorCuidador[cuidadorId] = {
        horas: data.horas,
        precioPorHora: data.precioPorHora,
      };
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
          cuidadoresIds: values.cuidadoresIds,
          personaId: values.personaId,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin ? fechaFin.toISOString() : undefined,
          horasPorCuidador: horasPorCuidador,
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
      setPersonaSearch('');
      setCuidadorSearch('');
      setPersonas([]);
      setCuidadoresFiltrados(cuidadores);
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
    
    // Preparar horas por cuidador
    const horasPorCuidador: Record<string, CuidadorAsignacion> = {};
    if (asignacion.horasPorCuidador) {
      Object.assign(horasPorCuidador, asignacion.horasPorCuidador);
    }
    // Si no hay datos por cuidador, inicializar con valores por defecto
    for (const cuidadorId of asignacion.cuidadoresIds) {
      if (!horasPorCuidador[cuidadorId]) {
        horasPorCuidador[cuidadorId] = { horas: 0, precioPorHora: 0 };
      }
    }

    editForm.setValues({
      cuidadoresIds: asignacion.cuidadoresIds,
      fechaInicio: new Date(asignacion.fechaInicio),
      fechaFin: asignacion.fechaFin ? new Date(asignacion.fechaFin) : null,
      horasPorCuidador: horasPorCuidador,
      notas: asignacion.notas || '',
    });
    
    openEdit();
  };

  const handleEditSubmit = async (values: typeof editForm.values) => {
    if (!selectedAsignacion) return;

    // Validar que todos los cuidadores tengan horas y precio por hora asignados
    const horasPorCuidador: Record<string, CuidadorAsignacion> = {};
    for (const cuidadorId of values.cuidadoresIds) {
      const data = values.horasPorCuidador[cuidadorId];
      if (!data || data.horas <= 0 || data.precioPorHora <= 0) {
        notifications.show({
          title: 'Error',
          message: `Ingresá las horas y precio por hora para todos los cuidadores seleccionados`,
          color: 'red',
        });
        setUpdating(false);
        return;
      }
      horasPorCuidador[cuidadorId] = {
        horas: data.horas,
        precioPorHora: data.precioPorHora,
      };
    }

    setUpdating(true);
    try {
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
          cuidadoresIds: values.cuidadoresIds,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin ? fechaFin.toISOString() : null,
          horasPorCuidador: horasPorCuidador,
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

      setCuidadorSearch('');
      setCuidadoresFiltrados(cuidadores);
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
                      <Text fw={600}>
                        {asignacion.cuidadoresNombres && asignacion.cuidadoresNombres.length > 0
                          ? asignacion.cuidadoresNombres.join(', ')
                          : asignacion.cuidadoresIds.join(', ')}
                      </Text>
                      <Badge color="fucsia">→</Badge>
                      <Text>{asignacion.personaNombre || asignacion.personaId}</Text>
                    </Group>
                <Text size="sm" c="dimmed">
                  Desde: {new Date(asignacion.fechaInicio).toLocaleDateString('es-AR')}
                  {asignacion.fechaFin && ` hasta ${new Date(asignacion.fechaFin).toLocaleDateString('es-AR')}`}
                </Text>
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
                <Button
                  size="xs"
                  leftSection={<IconBolt size={14} />}
                  color="cyan"
                  variant="light"
                  onClick={() => handleLiquidacionRapida(asignacion)}
                >
                  Liquidar
                </Button>
                <Button
                  size="xs"
                  leftSection={<IconCurrencyDollar size={14} />}
                  color="green"
                  variant="light"
                  onClick={() => handleVerComprobantes(asignacion)}
                >
                  Comprobantes
                </Button>
                  <ActionIcon 
                    color="red" 
                    variant="light" 
                    onClick={() => handleDeleteClick(asignacion.id, `${asignacion.cuidadoresNombres?.join(', ') || asignacion.cuidadoresIds.join(', ')} → ${asignacion.personaNombre || ''}`)}
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
              label="Persona Asistida"
              required
              searchable
              data={personas.map(p => ({ value: p.id, label: p.nombreCompleto }))}
              searchValue={personaSearch}
              onSearchChange={setPersonaSearch}
              {...form.getInputProps('personaId')}
              placeholder="Buscar por nombre (mínimo 2 letras)..."
            />
            <MultiSelect
              label="Cuidadores"
              required
              searchable
              data={(() => {
                // Incluir siempre los cuidadores seleccionados, incluso si no están en la búsqueda
                const selectedIds = form.values.cuidadoresIds || [];
                const selectedCuidadores = cuidadores.filter(c => selectedIds.includes(c.id));
                const allCuidadores = [...new Map([...selectedCuidadores, ...cuidadoresFiltrados].map(c => [c.id, c])).values()];
                return allCuidadores.map(c => ({ value: c.id, label: c.nombreCompleto }));
              })()}
              searchValue={cuidadorSearch}
              onSearchChange={setCuidadorSearch}
              {...form.getInputProps('cuidadoresIds')}
              placeholder="Seleccionar uno o más cuidadores..."
              classNames={{
                pill: 'multiselect-pill-custom',
              }}
              styles={() => ({
                pill: {
                  backgroundColor: '#ff3d75',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                },
                pillLabel: {
                  color: '#ffffff',
                },
                pillRemove: {
                  color: '#ffffff',
                },
                pillsList: {
                  gap: '6px',
                  rowGap: '6px',
                  columnGap: '6px',
                  '--pg-gap': '6px',
                },
                inputField: {
                  flex: 1,
                },
              })}
            />
            <DateInput label="Fecha Inicio" required locale="es" {...form.getInputProps('fechaInicio')} />
            <DateInput label="Fecha Fin (opcional)" locale="es" {...form.getInputProps('fechaFin')} />

            {/* Horas y precio por cuidador */}
            {form.values.cuidadoresIds.length > 0 && (
              <Paper p="md" withBorder>
                <Text fw={600} mb="md">Horas y Precio por Cuidador</Text>
                <Stack gap="md">
                  {form.values.cuidadoresIds.map((cuidadorId) => {
                    const cuidador = cuidadores.find(c => c.id === cuidadorId);
                    const data = form.values.horasPorCuidador[cuidadorId] || { horas: 0, precioPorHora: 0 };
                    return (
                      <Paper key={cuidadorId} p="sm" withBorder>
                        <Text fw={600} mb="sm">{cuidador?.nombreCompleto || cuidadorId}</Text>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          <NumberInput
                            label="Horas esperadas"
                            required
                            placeholder="0.00"
                            min={0}
                            step={0.5}
                            decimalScale={2}
                            value={data.horas}
                            onChange={(value) => {
                              form.setFieldValue('horasPorCuidador', {
                                ...form.values.horasPorCuidador,
                                [cuidadorId]: {
                                  ...data,
                                  horas: Number(value) || 0,
                                },
                              });
                            }}
                            leftSection="H"
                          />
                          <NumberInput
                            label="Precio por hora"
                            required
                            placeholder="0,00"
                            min={0}
                            step={100}
                            value={data.precioPorHora}
                            onChange={(value) => {
                              form.setFieldValue('horasPorCuidador', {
                                ...form.values.horasPorCuidador,
                                [cuidadorId]: {
                                  ...data,
                                  precioPorHora: Number(value) || 0,
                                },
                              });
                            }}
                            leftSection="$"
                            thousandSeparator="."
                            decimalSeparator=","
                          />
                        </SimpleGrid>
                        {data.horas > 0 && data.precioPorHora > 0 && (
                          <Text size="sm" c="dimmed" mt="xs">
                            Subtotal: ${(data.horas * data.precioPorHora).toLocaleString('es-AR', { minimumFractionDigits: 2, useGrouping: true })}
                          </Text>
                        )}
                      </Paper>
                    );
                  })}
                  <Group justify="space-between" mt="sm" p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '4px' }}>
                    <Text fw={600}>Total de horas trabajadas:</Text>
                    <Text fw={700} size="lg" c="fucsia">
                      {totalHorasTrabajadas.toFixed(2)} horas
                    </Text>
                  </Group>
                  <Group justify="space-between" p="sm" style={{ backgroundColor: 'var(--mantine-color-cyan-0)', borderRadius: '4px' }}>
                    <Text fw={600}>Total a liquidar:</Text>
                    <Text fw={700} size="lg" c="cyan">
                      ${totalMonto.toLocaleString('es-AR', { minimumFractionDigits: 2, useGrouping: true })}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            )}

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
                      ${Object.values(selectedAsignacion.horasPorCuidador).reduce((sum, data) => sum + (data.horas * data.precioPorHora), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
                  <Text size="sm" fw={600}>
                    {selectedAsignacion.personaNombre}
                  </Text>
                </Group>
              </Paper>
            )}
            <MultiSelect
              label="Cuidadores"
              required
              searchable
              data={(() => {
                // Incluir siempre los cuidadores seleccionados, incluso si no están en la búsqueda
                const selectedIds = editForm.values.cuidadoresIds || [];
                const selectedCuidadores = cuidadores.filter(c => selectedIds.includes(c.id));
                const allCuidadores = [...new Map([...selectedCuidadores, ...cuidadoresFiltrados].map(c => [c.id, c])).values()];
                return allCuidadores.map(c => ({ value: c.id, label: c.nombreCompleto }));
              })()}
              searchValue={cuidadorSearch}
              onSearchChange={setCuidadorSearch}
              {...editForm.getInputProps('cuidadoresIds')}
              placeholder="Seleccionar uno o más cuidadores..."
              classNames={{
                pill: 'multiselect-pill-custom',
              }}
              styles={() => ({
                pill: {
                  backgroundColor: '#ff3d75',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                },
                pillLabel: {
                  color: '#ffffff',
                },
                pillRemove: {
                  color: '#ffffff',
                },
                pillsList: {
                  gap: '6px',
                  rowGap: '6px',
                  columnGap: '6px',
                  '--pg-gap': '6px',
                },
                inputField: {
                  flex: 1,
                },
              })}
            />
            <DateInput label="Fecha Inicio" required locale="es" {...editForm.getInputProps('fechaInicio')} />
            <DateInput label="Fecha Fin (opcional)" locale="es" {...editForm.getInputProps('fechaFin')} />

            {/* Horas y precio por cuidador */}
            {editForm.values.cuidadoresIds.length > 0 && (
              <Paper p="md" withBorder>
                <Text fw={600} mb="md">Horas y Precio por Cuidador</Text>
                <Stack gap="md">
                  {editForm.values.cuidadoresIds.map((cuidadorId) => {
                    const cuidador = cuidadores.find(c => c.id === cuidadorId);
                    const data = editForm.values.horasPorCuidador[cuidadorId] || { horas: 0, precioPorHora: 0 };
                    return (
                      <Paper key={cuidadorId} p="sm" withBorder>
                        <Text fw={600} mb="sm">{cuidador?.nombreCompleto || cuidadorId}</Text>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                          <NumberInput
                            label="Horas esperadas"
                            required
                            placeholder="0.00"
                            min={0}
                            step={0.5}
                            decimalScale={2}
                            value={data.horas}
                            onChange={(value) => {
                              editForm.setFieldValue('horasPorCuidador', {
                                ...editForm.values.horasPorCuidador,
                                [cuidadorId]: {
                                  ...data,
                                  horas: Number(value) || 0,
                                },
                              });
                            }}
                            leftSection="H"
                          />
                          <NumberInput
                            label="Precio por hora"
                            required
                            placeholder="0,00"
                            min={0}
                            step={100}
                            value={data.precioPorHora}
                            onChange={(value) => {
                              editForm.setFieldValue('horasPorCuidador', {
                                ...editForm.values.horasPorCuidador,
                                [cuidadorId]: {
                                  ...data,
                                  precioPorHora: Number(value) || 0,
                                },
                              });
                            }}
                            leftSection="$"
                            thousandSeparator="."
                            decimalSeparator=","
                          />
                        </SimpleGrid>
                        {data.horas > 0 && data.precioPorHora > 0 && (
                          <Text size="sm" c="dimmed" mt="xs">
                            Subtotal: ${(data.horas * data.precioPorHora).toLocaleString('es-AR', { minimumFractionDigits: 2, useGrouping: true })}
                          </Text>
                        )}
                      </Paper>
                    );
                  })}
                  <Group justify="space-between" mt="sm" p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '4px' }}>
                    <Text fw={600}>Total de horas trabajadas:</Text>
                    <Text fw={700} size="lg" c="fucsia">
                      {totalHorasTrabajadasEdit.toFixed(2)} horas
                    </Text>
                  </Group>
                  <Group justify="space-between" p="sm" style={{ backgroundColor: 'var(--mantine-color-cyan-0)', borderRadius: '4px' }}>
                    <Text fw={600}>Total a liquidar:</Text>
                    <Text fw={700} size="lg" c="cyan">
                      ${totalMontoEdit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            )}

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

      {/* Modal Liquidación Rápida */}
      <Modal opened={rapidaOpened} onClose={closeRapida} title="Liquidación Rápida" size="lg">
        {selectedRapidaAsignacion && (
          <Stack gap="md">
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={600} mb="xs">
                Persona Asistida: {selectedRapidaAsignacion.personaNombre || selectedRapidaAsignacion.personaId}
              </Text>
              <Group gap="xs" mt="xs">
                <Text size="xs" c="dimmed">Cuidadores:</Text>
                {selectedRapidaAsignacion.cuidadoresNombres && selectedRapidaAsignacion.cuidadoresNombres.length > 0
                  ? selectedRapidaAsignacion.cuidadoresNombres.map((nombre, idx) => (
                      <Badge key={idx} size="sm" variant="light" color="fucsia">
                        {nombre}
                      </Badge>
                    ))
                  : selectedRapidaAsignacion.cuidadoresIds.map((id, idx) => (
                      <Badge key={idx} size="sm" variant="light">
                        {id}
                      </Badge>
                    ))}
              </Group>
            </Paper>

            {selectedRapidaAsignacion.cuidadoresIds.length > 1 && (
              <Select
                label="Seleccionar Cuidador"
                required
                placeholder="Seleccionar cuidador de la asignación"
                data={selectedRapidaAsignacion.cuidadoresIds.map(id => {
                  const cuidador = cuidadores.find(c => c.id === id);
                  const data = selectedRapidaAsignacion.horasPorCuidador?.[id];
                  return {
                    value: id,
                    label: `${cuidador?.nombreCompleto || id}${data ? ` - ${data.horas}h @ $${data.precioPorHora.toLocaleString('es-AR', { useGrouping: true })}/h` : ''}`,
                  };
                })}
                value={selectedRapidaCuidadorId}
                onChange={(value) => setSelectedRapidaCuidadorId(value || '')}
              />
            )}

            {selectedRapidaCuidadorId && (
              <>
                {selectedRapidaAsignacion.horasPorCuidador?.[selectedRapidaCuidadorId] && (
                  <Paper p="md" withBorder bg="gray.0">
                    <Stack gap="xs">
                      <Text size="sm" fw={600} mb="xs">Datos de la asignación:</Text>
                      <Group justify="space-between">
                        <Text size="sm">Precio por hora:</Text>
                        <Text size="sm" fw={600}>
                          ${selectedRapidaAsignacion.horasPorCuidador[selectedRapidaCuidadorId].precioPorHora.toLocaleString('es-AR', { useGrouping: true })}
                        </Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm">Horas esperadas:</Text>
                        <Text size="sm" fw={600}>
                          {selectedRapidaAsignacion.horasPorCuidador[selectedRapidaCuidadorId].horas.toFixed(2)} horas
                        </Text>
                      </Group>
                    <Group justify="space-between">
                      <Text size="sm">Fecha inicio:</Text>
                      <Text size="sm" fw={600}>
                        {new Date(selectedRapidaAsignacion.fechaInicio).toLocaleDateString('es-AR')}
                      </Text>
                    </Group>
                    {selectedRapidaAsignacion.fechaFin && (
                      <Group justify="space-between">
                        <Text size="sm">Fecha fin:</Text>
                        <Text size="sm" fw={600}>
                          {new Date(selectedRapidaAsignacion.fechaFin).toLocaleDateString('es-AR')}
                        </Text>
                      </Group>
                    )}
                    </Stack>
                  </Paper>
                )}

                <NumberInput
                  label="Precio por hora"
                  required
                  placeholder="0,00"
                  min={0}
                  step={100}
                  value={rapidaPrecioPorHora}
                  onChange={(value) => setRapidaPrecioPorHora(Number(value) || 0)}
                  leftSection="$"
                  thousandSeparator="."
                  decimalSeparator=","
                  description="Editá el precio por hora si difiere del de la asignación"
                />

                <NumberInput
                  label="Horas trabajadas"
                  required
                  placeholder="0,00"
                  min={0}
                  step={0.5}
                  decimalScale={2}
                  value={rapidaHorasTrabajadas}
                  onChange={(value) => setRapidaHorasTrabajadas(Number(value) || 0)}
                  leftSection={<IconCalculator size={18} />}
                  description="Editá las horas trabajadas si difieren de las esperadas"
                />

                {rapidaHorasTrabajadas > 0 && rapidaPrecioPorHora > 0 && (
                  <Paper p="md" withBorder bg="cyan.0">
                    <Stack gap="xs">
                      <Text size="sm" fw={600}>Resumen de liquidación:</Text>
                      <Group justify="space-between">
                        <Text size="sm">Total a liquidar:</Text>
                        <Text size="lg" fw={700} c="cyan">
                          ${(rapidaHorasTrabajadas * rapidaPrecioPorHora).toLocaleString('es-AR', { minimumFractionDigits: 2, useGrouping: true })}
                        </Text>
                      </Group>
                    </Stack>
                  </Paper>
                )}
              </>
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeRapida}>
                Cancelar
              </Button>
              <Button
                color="cyan"
                onClick={handleUsarDatosLiquidacion}
                disabled={!selectedRapidaCuidadorId || !selectedRapidaAsignacion || !rapidaHorasTrabajadas || rapidaHorasTrabajadas <= 0 || !rapidaPrecioPorHora || rapidaPrecioPorHora <= 0 || liquidando}
                loading={liquidando}
                leftSection={<IconCalculator size={16} />}
              >
                Liquidar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Modal Comprobantes */}
      <Modal opened={comprobantesOpened} onClose={closeComprobantes} title="Comprobantes de Liquidación" size="lg">
        {asignacionComprobantes && (
          <Stack gap="md">
            <Paper p="sm" withBorder bg="gray.0">
              <Text size="sm" fw={600} mb="xs">
                Asignación: {asignacionComprobantes.personaNombre || asignacionComprobantes.personaId}
              </Text>
              <Group gap="xs" mt="xs">
                <Text size="xs" c="dimmed">Cuidadores:</Text>
                {asignacionComprobantes.cuidadoresNombres && asignacionComprobantes.cuidadoresNombres.length > 0
                  ? asignacionComprobantes.cuidadoresNombres.map((nombre, idx) => (
                      <Badge key={idx} size="sm" variant="light" color="fucsia">
                        {nombre}
                      </Badge>
                    ))
                  : asignacionComprobantes.cuidadoresIds.map((id, idx) => (
                      <Badge key={idx} size="sm" variant="light">
                        {id}
                      </Badge>
                    ))}
              </Group>
            </Paper>

            {comprobantes.length > 0 ? (
              <Stack gap="sm">
                {comprobantes.map((comprobante) => (
                  <Paper key={comprobante.id} p="md" withBorder>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap="xs" style={{ flex: 1 }}>
                        <Group>
                          <Text fw={600}>Comprobante #{comprobante.id.substring(0, 8).toUpperCase()}</Text>
                          <Badge color="green" variant="light">Liquidación</Badge>
                        </Group>
                        <Text size="sm" c="dimmed">
                          Fecha: {new Date(comprobante.fecha).toLocaleDateString('es-AR')}
                        </Text>
                        {comprobante.horasTrabajadas && (
                          <Text size="sm" c="dimmed">
                            Horas: {Number(comprobante.horasTrabajadas).toFixed(2)}h
                          </Text>
                        )}
                        {comprobante.precioPorHora && (
                          <Text size="sm" c="dimmed">
                            Precio/hora: ${Number(comprobante.precioPorHora).toLocaleString('es-AR', { useGrouping: true })}
                          </Text>
                        )}
                        <Text size="lg" fw={700} c="cyan">
                          Total: ${Number(comprobante.monto).toLocaleString('es-AR', { minimumFractionDigits: 2, useGrouping: true })}
                        </Text>
                      </Stack>
                      <Button
                        leftSection={<IconFileText size={16} />}
                        color="cyan"
                        variant="light"
                        onClick={() => {
                          window.open(`/api/v1/liquidaciones/${comprobante.id}/recibo.pdf`, '_blank');
                        }}
                      >
                        Ver PDF
                      </Button>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Paper p="xl" withBorder>
                <Stack align="center" gap="md">
                  <IconFileText size={48} color="gray" />
                  <Text c="dimmed" ta="center">
                    No hay comprobantes de liquidación para esta asignación
                  </Text>
                </Stack>
              </Paper>
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeComprobantes}>
                Cerrar
              </Button>
            </Group>
          </Stack>
        )}
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
