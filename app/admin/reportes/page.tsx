'use client';

import { Container, Title, Paper, Stack, Group, Text, Select, Button, Card, Badge } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { extractApiErrorMessage, parseApiError } from '../utils/parseApiError';
import { IconChartBar } from '@tabler/icons-react';

export default function ReportesPage() {
  const [cuidadorId, setCuidadorId] = useState<string>('');
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    totalPagado: number;
    cantidadPagos: number;
    agrupacionesPorMes?: Array<{ mes: string; total: number; cantidad: number }>;
  } | null>(null);
  const [cuidadores, setCuidadores] = useState<Array<{ id: string; nombreCompleto: string }>>([]);

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

  const handleSearch = async () => {
    if (!cuidadorId) {
      notifications.show({
        title: 'Error',
        message: 'Seleccioná un cuidador',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ cuidadorId });
      if (from) params.append('from', from.toISOString());
      if (to) params.append('to', to.toISOString());
      params.append('groupByMonth', 'true');

      const response = await fetch(`/api/v1/reportes/saldos?${params}`);
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || 'Error al obtener saldos');
      }

      setResult(data.data);
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
        Reportes de Saldos
      </Title>

      <Paper p="md" withBorder mb="xl">
        <Stack>
          <Select
            label="Cuidador"
            required
            data={cuidadores.map(c => ({ value: c.id, label: c.nombreCompleto }))}
            value={cuidadorId}
            onChange={(value) => setCuidadorId(value || '')}
          />
          <Group grow>
            <DateInput label="Desde" value={from} onChange={(value) => setFrom(value as unknown as Date | null)} locale="es" />
            <DateInput label="Hasta" value={to} onChange={(value) => setTo(value as unknown as Date | null)} locale="es" />
          </Group>
          <Button onClick={handleSearch} loading={loading} color="fucsia">
            Buscar
          </Button>
        </Stack>
      </Paper>

      {result && (
        <Stack>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group>
                <IconChartBar size={32} color="#FF6B9D" />
                <Title order={3}>Resultados</Title>
              </Group>
              <Group>
                <div>
                  <Text size="sm" c="dimmed">Total Pagado</Text>
                  <Text size="xl" fw={600} c="fucsia">
                    ${result.totalPagado.toLocaleString()}
                  </Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Cantidad de Pagos</Text>
                  <Text size="xl" fw={600} c="cian">
                    {result.cantidadPagos}
                  </Text>
                </div>
              </Group>
            </Stack>
          </Card>

          {result.agrupacionesPorMes && result.agrupacionesPorMes.length > 0 && (
            <Paper p="md" withBorder>
              <Title order={4} mb="md">Agrupación por Mes</Title>
              <Stack gap="xs">
                {result.agrupacionesPorMes.map((item) => (
                  <Group key={item.mes} justify="space-between" p="xs" style={{ background: '#f8f9fa', borderRadius: 4 }}>
                    <Text fw={500}>{item.mes}</Text>
                    <Group gap="lg">
                      <Text>${item.total.toLocaleString()}</Text>
                      <Badge>{item.cantidad} pagos</Badge>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      )}
    </Container>
  );
}
