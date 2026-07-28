'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Group, Text, Button } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { createClient } from '@/src/infrastructure/supabase/client';
import '../panel-globals.css';
import styles from './empleado.module.css';

export default function EmpleadoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // La suscripción emite INITIAL_SESSION al montarse, así que también cubre
    // la carga inicial sin tener que pedir el usuario por separado.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    // Mismos tokens que el panel: el portal es parte del sistema, no una web
    // aparte. Va en el body porque los modales se renderizan en un portal.
    document.body.classList.add('panel-oscuro');
    return () => {
      if (!window.location.pathname.startsWith('/empleado')) {
        document.body.classList.remove('panel-oscuro');
      }
    };
  }, []);

  const salir = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Container size="sm" px="xs">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
              <span className={`material-icons ${styles.logoIcon}`}>medical_services</span>
              <div style={{ minWidth: 0 }}>
                <Text fw={700} size="sm" className={styles.logoTitle}>
                  CareByDani
                </Text>
                <Text size="xs" truncate className={styles.email}>
                  {email ?? '...'}
                </Text>
              </div>
            </Group>
            <Button variant="subtle" size="xs" leftSection={<IconLogout size={16} />} onClick={salir}>
              Salir
            </Button>
          </Group>
        </Container>
      </header>

      <Container size="sm" py="md" px="xs">
        {children}
      </Container>
    </div>
  );
}
