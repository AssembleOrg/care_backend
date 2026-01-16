'use client';

import { Container, Title, Text, Grid, Card, Stack, Group, Loader } from '@mantine/core';
import { IconUsers, IconReceipt, IconChartBar } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

interface DashboardStats {
  totalCuidadores: number;
  totalPagos: number;
  saldoTotalMes: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/dashboard/stats');
        const result = await response.json();

        if (!result.ok) {
          throw new Error(result.error || 'Error al cargar estadísticas');
        }

        setStats(result.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="xl">
        Dashboard
      </Title>
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group>
                <IconUsers size={32} color="#FF6B9D" />
                <Title order={3}>Cuidadores</Title>
              </Group>
              {loading ? (
                <Loader size="sm" />
              ) : error ? (
                <Text size="sm" c="red">Error</Text>
              ) : (
                <>
                  <Text size="xl" fw={600}>
                    {stats?.totalCuidadores ?? 0}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Total registrados
                  </Text>
                </>
              )}
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group>
                <IconReceipt size={32} color="#00D9FF" />
                <Title order={3}>Pagos</Title>
              </Group>
              {loading ? (
                <Loader size="sm" />
              ) : error ? (
                <Text size="sm" c="red">Error</Text>
              ) : (
                <>
                  <Text size="xl" fw={600}>
                    {stats?.totalPagos ?? 0}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Total registrados
                  </Text>
                </>
              )}
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group>
                <IconChartBar size={32} color="#FFD93D" />
                <Title order={3}>Saldo Total</Title>
              </Group>
              {loading ? (
                <Loader size="sm" />
              ) : error ? (
                <Text size="sm" c="red">Error</Text>
              ) : (
                <>
                  <Text size="xl" fw={600}>
                    ${stats?.saldoTotalMes.toLocaleString('es-AR') ?? '0'}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Este mes
                  </Text>
                </>
              )}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
