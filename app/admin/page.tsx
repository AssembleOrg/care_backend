'use client';

import { Container, Title, Text, Grid, Card, Stack, Group } from '@mantine/core';
import { IconUsers, IconReceipt, IconChartBar } from '@tabler/icons-react';

export default function AdminDashboard() {
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
              <Text size="xl" fw={600}>0</Text>
              <Text size="sm" c="dimmed">Total registrados</Text>
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
              <Text size="xl" fw={600}>0</Text>
              <Text size="sm" c="dimmed">Total registrados</Text>
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
              <Text size="xl" fw={600}>$0</Text>
              <Text size="sm" c="dimmed">Este mes</Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
