'use client';

import { Container, Title, Button, Table, Modal, TextInput, Stack, Group, Select, NumberInput, ActionIcon, Badge, Paper, Text, Pagination, Card } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconFileText, IconFilter, IconX, IconEye } from '@tabler/icons-react';
import { ViewToggle, useViewMode } from '../components/ViewToggle';
import { extractApiErrorMessage, parseApiError } from '../utils/parseApiError';
import cardStyles from '../components/card-view.module.css';

interface Pago {
  id: string;
  cuidadorId: string;
  cuidadorNombre?: string;
  personaId: string | null;
  monto: number;
  fecha: string;
  metodo: string;
  nota: string | null;
  esLiquidacion?: boolean;
}

interface PaginatedResponse {
  data: Pago[];
  total: number;
  page: number;
  limit: number;
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [cuidadores, setCuidadores] = useState<Array<{ id: string; nombreCompleto: string }>>([]);
  
  // Filtros y paginación
  const [cuidadorFiltro, setCuidadorFiltro] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useViewMode('list');
  const [submitting, setSubmitting] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      cuidadorId: '',
      personaId: '',
      monto: 0,
      fecha: new Date(),
      metodo: 'EFECTIVO',
      nota: '',
    },
  });

  const fetchPagos = async (currentPage: number = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
      });
      
      if (cuidadorFiltro) {
        params.set('cuidadorId', cuidadorFiltro);
      }
      if (fechaDesde) {
        params.set('from', fechaDesde.toISOString());
      }
      if (fechaHasta) {
        params.set('to', fechaHasta.toISOString());
      }

      const response = await fetch(`/api/v1/pagos?${params}`);
      const data = await response.json();
      if (data.ok) {
        // Si hay filtros, puede venir como array directo o como objeto paginado
        if (Array.isArray(data.data)) {
          setPagos(data.data);
          setTotal(data.data.length);
        } else {
          const result = data.data as PaginatedResponse;
          setPagos(result.data);
          setTotal(result.total);
          setPage(result.page);
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar pagos',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCuidadores = async () => {
    try {
      const response = await fetch('/api/v1/cuidadores?all=true');
      const data = await response.json();
      if (data.ok && Array.isArray(data.data)) {
        setCuidadores(data.data);
      }
    } catch (error) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchCuidadores();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchPagos(1);
  }, [cuidadorFiltro, fechaDesde, fechaHasta]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPagos(newPage);
  };

  const totalPages = useMemo(() => Math.ceil(total / 20), [total]);

  const handleSubmit = async (values: typeof form.values) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          personaId: values.personaId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(extractApiErrorMessage(data) || 'Error al crear pago');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Pago creado correctamente',
        color: 'green',
      });

      form.reset();
      close();
      fetchPagos();
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

  const handleGeneratePDF = async (pagoId: string) => {
    setGeneratingPDF(pagoId);
    try {
      const response = await fetch(`/api/v1/pagos/${pagoId}/recibo.pdf`);
      if (!response.ok) throw new Error('Error al generar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${pagoId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: 'Éxito',
        message: 'PDF generado correctamente',
        color: 'green',
      });
    } catch (error: unknown) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setGeneratingPDF(null);
    }
  };

  const clearFilters = () => {
    setCuidadorFiltro('');
    setFechaDesde(null);
    setFechaHasta(null);
  };

  const hasFilters = cuidadorFiltro || fechaDesde || fechaHasta;

  // Calcular totales
  const totalMonto = pagos.reduce((sum, p) => sum + p.monto, 0);

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Pagos</Title>
        <Group>
          <Button 
            leftSection={<IconFilter size={16} />} 
            variant={showFilters ? 'filled' : 'light'}
            color="cian"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros {hasFilters && `(${[cuidadorFiltro, fechaDesde, fechaHasta].filter(Boolean).length})`}
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={open} color="fucsia">
            Nuevo Pago
          </Button>
        </Group>
      </Group>

      {/* Panel de Filtros */}
      {showFilters && (
        <Paper p="md" withBorder mb="xl">
          <Group justify="space-between" mb="md">
            <Text fw={600}>Filtros</Text>
            <Group>
              {hasFilters && (
                <Button 
                  size="xs" 
                  variant="subtle" 
                  color="red" 
                  leftSection={<IconX size={14} />}
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </Button>
              )}
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </Group>
          </Group>
          <Group grow>
            <Select
              label="Cuidador"
              placeholder="Todos los cuidadores"
              clearable
              data={cuidadores.map(c => ({ value: c.id, label: c.nombreCompleto }))}
              value={cuidadorFiltro}
              onChange={(value) => setCuidadorFiltro(value || '')}
            />
            <DateInput
              label="Desde"
              placeholder="Fecha inicio"
              value={fechaDesde}
              onChange={(value) => setFechaDesde(value ? (value as unknown as Date) : null)}
              locale="es"
              clearable
            />
            <DateInput
              label="Hasta"
              placeholder="Fecha fin"
              value={fechaHasta}
              onChange={(value) => setFechaHasta(value ? (value as unknown as Date) : null)}
              locale="es"
              clearable
            />
          </Group>
        </Paper>
      )}

      {/* View Toggle cuando los filtros están cerrados */}
      {!showFilters && (
        <Group justify="flex-end" mb="md">
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </Group>
      )}

      {/* Resumen */}
      {pagos.length > 0 && (
        <Paper p="md" withBorder mb="xl" bg="gray.0">
          <Group justify="space-between">
            <Text>
              <Text component="span" fw={600}>{pagos.length}</Text> pagos encontrados
            </Text>
            <Text>
              Total: <Text component="span" fw={700} c="fucsia">${totalMonto.toLocaleString()}</Text>
            </Text>
          </Group>
        </Paper>
      )}

      {viewMode === 'list' ? (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Cuidador</Table.Th>
              <Table.Th>Monto</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Método</Table.Th>
              <Table.Th>Nota</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed">Cargando...</Text>
                </Table.Td>
              </Table.Tr>
            ) : pagos.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed">No hay pagos {hasFilters ? 'con los filtros seleccionados' : ''}</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              pagos.map((pago) => (
                <Table.Tr key={pago.id}>
                  <Table.Td>
                    <Text fw={500}>{pago.cuidadorNombre || pago.cuidadorId}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} c={pago.esLiquidacion ? 'fucsia' : undefined}>
                      ${pago.monto.toLocaleString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>{new Date(pago.fecha).toLocaleDateString('es-AR')}</Table.Td>
                  <Table.Td>
                    <Badge color={pago.esLiquidacion ? 'fucsia' : 'gray'}>{pago.metodo}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={1}>{pago.nota || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon 
                      color="cian" 
                      variant="light" 
                      onClick={() => handleGeneratePDF(pago.id)}
                      loading={generatingPDF === pago.id}
                      disabled={generatingPDF === pago.id}
                    >
                      <IconFileText size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      ) : (
        <div className={cardStyles.cardGrid}>
          {loading ? (
            <Text ta="center" c="dimmed" w="100%">Cargando...</Text>
          ) : pagos.length === 0 ? (
            <Text ta="center" c="dimmed" w="100%">No hay pagos {hasFilters ? 'con los filtros seleccionados' : ''}</Text>
          ) : (
            pagos.map((pago) => (
              <div key={pago.id} className={cardStyles.cardItem}>
                <div className={cardStyles.cardHeader}>
                  <h3 className={cardStyles.cardTitle}>{pago.cuidadorNombre || pago.cuidadorId}</h3>
                  <Group gap="xs" className={cardStyles.cardActions}>
                    <ActionIcon 
                      color="cian" 
                      variant="light" 
                      size="sm" 
                      onClick={() => handleGeneratePDF(pago.id)}
                      loading={generatingPDF === pago.id}
                      disabled={generatingPDF === pago.id}
                    >
                      <IconFileText size={16} />
                    </ActionIcon>
                  </Group>
                </div>
                <div className={cardStyles.cardBody}>
                  <div className={cardStyles.cardField}>
                    <span className={cardStyles.cardFieldLabel}>Monto</span>
                    <span className={cardStyles.cardFieldValue} style={{ color: pago.esLiquidacion ? '#FF6B9D' : undefined, fontWeight: 700 }}>
                      ${pago.monto.toLocaleString()}
                    </span>
                  </div>
                  <div className={cardStyles.cardField}>
                    <span className={cardStyles.cardFieldLabel}>Fecha</span>
                    <span className={cardStyles.cardFieldValue}>
                      {new Date(pago.fecha).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <div className={cardStyles.cardField}>
                    <span className={cardStyles.cardFieldLabel}>Método</span>
                    <Badge color={pago.esLiquidacion ? 'fucsia' : 'gray'} size="sm">
                      {pago.metodo}
                    </Badge>
                  </div>
                  {pago.nota && (
                    <div className={cardStyles.cardField}>
                      <span className={cardStyles.cardFieldLabel}>Nota</span>
                      <span className={cardStyles.cardFieldValue}>
                        {pago.nota}
                      </span>
                    </div>
                  )}
                  {pago.esLiquidacion && (
                    <Badge color="fucsia" variant="light" size="sm" style={{ alignSelf: 'flex-start' }}>
                      Liquidación
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Group justify="center" mt="xl">
        <Pagination value={page} onChange={handlePageChange} total={Math.max(totalPages, 1)} />
      </Group>

      <Modal opened={opened} onClose={close} title="Nuevo Pago">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Cuidador"
              required
              data={cuidadores.map(c => ({ value: c.id, label: c.nombreCompleto }))}
              {...form.getInputProps('cuidadorId')}
            />
            <NumberInput label="Monto" required min={0} leftSection="$" {...form.getInputProps('monto')} />
            <DateInput label="Fecha" required locale="es" {...form.getInputProps('fecha')} />
            <Select
              label="Método"
              required
              data={['EFECTIVO', 'TRANSFERENCIA', 'OTRO']}
              {...form.getInputProps('metodo')}
            />
            <TextInput label="Nota" {...form.getInputProps('nota')} />
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
    </Container>
  );
}
