'use client';

import { AppShell, NavLink, Group, Text, Avatar, Menu, UnstyledButton, Divider } from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';
import { IconHome, IconUsers, IconUser, IconFileText, IconReceipt, IconChartBar, IconLogout, IconChevronDown, IconCalculator, IconClipboardText } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/src/infrastructure/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Mark as mounted after first render to avoid hydration issues
    setMounted(true);

    let isMounted = true;

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted) {
        setUser(user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
        <Text c="dimmed">Cargando...</Text>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Dashboard', icon: IconHome, href: '/admin' },
    { label: 'Cuidadores', icon: IconUsers, href: '/admin/cuidadores' },
    { label: 'Personas Asistidas', icon: IconUser, href: '/admin/personas-asistidas' },
    { label: 'Asignaciones', icon: IconFileText, href: '/admin/asignaciones' },
    { label: 'Pagos', icon: IconReceipt, href: '/admin/pagos' },
    { label: 'Liquidaciones', icon: IconCalculator, href: '/admin/liquidaciones' },
    { label: 'Reportes', icon: IconChartBar, href: '/admin/reportes' },
    { label: 'Contratos', icon: IconClipboardText, href: '/admin/contratos' },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
      }}
      padding="md"
      styles={{
        main: {
          background: '#f8f9fa',
        },
      }}
    >
      <AppShell.Header style={{ background: 'white', borderBottom: '1px solid #eaeaea' }}>
        <Group h="100%" px="md" justify="space-between">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Text fw={700} size="lg" style={{
              background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C69 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              CareByDani
            </Text>
          </Link>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <UnstyledButton>
                <Group gap="xs">
                  <Avatar size="sm" radius="xl" color="pink">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </Avatar>
                  <Text size="sm" fw={500}>
                    {user?.email?.split('@')[0] || 'Admin'}
                  </Text>
                  <IconChevronDown size={14} />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{user?.email || 'admin@example.com'}</Menu.Label>
              <Menu.Divider />
              <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={handleLogout}>
                Cerrar sesión
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ background: 'white', borderRight: '1px solid #eaeaea' }}>
        <AppShell.Section grow>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              label={item.label}
              leftSection={<item.icon size={20} />}
              active={pathname === item.href}
              onClick={() => router.push(item.href)}
              mb="xs"
              style={{
                borderRadius: '8px',
              }}
              styles={{
                root: {
                  '&[data-active="true"]': {
                    background: 'rgba(255, 107, 157, 0.1)',
                    color: '#FF6B9D',
                  },
                },
              }}
            />
          ))}
        </AppShell.Section>

        <AppShell.Section>
          <Divider my="sm" />
          <NavLink
            label="Volver al inicio"
            leftSection={<IconHome size={20} />}
            onClick={() => router.push('/')}
            style={{ borderRadius: '8px' }}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
