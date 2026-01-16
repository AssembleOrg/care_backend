'use client';

import { Container, Paper, Title, TextInput, PasswordInput, Button, Stack, Alert, Text, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { createClient } from '@/src/infrastructure/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (!value ? 'Email requerido' : /^\S+@\S+$/.test(value) ? null : 'Email inválido'),
      password: (value) => (!value ? 'Contraseña requerida' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      notifications.show({
        title: 'Éxito',
        message: 'Sesión iniciada correctamente',
        color: 'green',
      });

      router.push('/admin');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', display: 'flex', alignItems: 'center' }}>
      <Container size={420}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Text ta="center" size="sm" c="dimmed" mb="md" style={{ cursor: 'pointer' }}>
            ← Volver al inicio
          </Text>
        </Link>
        <Paper withBorder shadow="xl" p={40} radius="lg" style={{ background: 'white' }}>
          <Title ta="center" mb="xs" order={2} style={{ color: '#1a1a2e' }}>
            CareByDani
          </Title>
          <Text ta="center" c="dimmed" size="sm" mb="xl">
            Panel de Administración
          </Text>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              {error && (
                <Alert color="red" title="Error">
                  {error}
                </Alert>
              )}
              <TextInput
                label="Email"
                placeholder="admin@example.com"
                required
                size="md"
                {...form.getInputProps('email')}
              />
              <PasswordInput
                label="Contraseña"
                placeholder="Tu contraseña"
                required
                size="md"
                {...form.getInputProps('password')}
              />
              <Button type="submit" fullWidth loading={loading} size="md" style={{ background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8C69 100%)' }}>
                Iniciar sesión
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </div>
  );
}
