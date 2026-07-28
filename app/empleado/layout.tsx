'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Group, Text, Button, Paper } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { createClient } from '@/src/infrastructure/supabase/client';

export default function EmpleadoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    supabase.auth.getUser().then(({ data }) => {
      if (vivo) setEmail(data.user?.email ?? null);
    });
    return () => {
      vivo = false;
    };
  }, [supabase]);

  const salir = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#f6f7fb' }}>
      <Paper shadow="xs" p="sm" radius={0} style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <Container size="sm" px="xs">
          <Group justify="space-between" wrap="nowrap">
            <div style={{ minWidth: 0 }}>
              <Text fw={700} size="sm">
                Care By Dani
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {email ?? '...'}
              </Text>
            </div>
            <Button variant="subtle" size="xs" leftSection={<IconLogout size={16} />} onClick={salir}>
              Salir
            </Button>
          </Group>
        </Container>
      </Paper>
      <Container size="sm" py="md" px="xs">
        {children}
      </Container>
    </div>
  );
}
