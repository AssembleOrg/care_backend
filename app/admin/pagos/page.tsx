'use client';

import { Container, Title, Button, Table, Modal, TextInput, Stack, Group, Select, NumberInput, ActionIcon, Badge, Paper, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconFileText, IconFilter, IconX } from '@tabler/icons-react';

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

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [cuidadores, setCuidadores] = useState<Array<{ id: string; nombreCompleto: string }>>([]);
  
  // Filtros
  const [cuidadorFiltro, setCuidadorFiltro] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<Date | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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

  const fetchPagos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ all: 'true' });
      
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
        setPagos(Array.isArray(data.data) ? data.data : []);
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
    fetchPagos();
  }, [cuidadorFiltro, fechaDesde, fechaHasta]);

  const handleSubmit = async (values: typeof form.values) => {
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
        throw new Error(data.error?.message || 'Error al crear pago');
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
      const message = error instanceof Error ? error.message : 'Error desconocido';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    }
  };

  const handleGeneratePDF = async (pagoId: string) => {
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
      const message = error instanceof Error ? error.message : 'Error desconocido';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
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
                  <ActionIcon color="cian" variant="light" onClick={() => handleGeneratePDF(pago.id)}>
                    <IconFileText size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

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
              <Button type="submit" color="fucsia">
                Crear
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
