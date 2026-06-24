'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Container,
    Title,
    Text,
    Paper,
    Group,
    Stack,
    Badge,
    Button,
    Image,
    Loader,
    Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconLogout, IconAlertCircle, IconQrcode } from '@tabler/icons-react';

interface BotStatus {
    connected: boolean;
    loggedIn: boolean;
    qr: string | null; // PNG base64
    error?: string;
}

export default function WhatsappPage() {
    const [status, setStatus] = useState<BotStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/v1/whatsapp-bot', { cache: 'no-store' });
            const data = await res.json();
            setStatus(data);
        } catch {
            setStatus({ connected: false, loggedIn: false, qr: null, error: 'Sin conexión con el bot.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        // Poll cada 4s: mientras no esté vinculado el QR se refresca solo.
        pollRef.current = setInterval(fetchStatus, 4000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [fetchStatus]);

    const doAction = async (action: 'restart' | 'logout') => {
        setActing(true);
        try {
            const res = await fetch('/api/v1/whatsapp-bot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                notifications.show({
                    title: action === 'restart' ? 'Reiniciando bot' : 'Cerrando sesión',
                    message:
                        action === 'restart'
                            ? 'El bot se está reiniciando. En unos segundos vuelve a conectar.'
                            : 'Sesión cerrada. Escaneá el nuevo QR cuando aparezca.',
                    color: 'blue',
                });
            } else {
                notifications.show({ title: 'Error', message: data.error || 'No se pudo completar la acción.', color: 'red' });
            }
        } catch {
            notifications.show({ title: 'Error', message: 'No se pudo contactar al bot.', color: 'red' });
        } finally {
            setActing(false);
            setTimeout(fetchStatus, 3000);
        }
    };

    const confirmLogout = () => {
        if (window.confirm('¿Cerrar la sesión de WhatsApp? Vas a tener que escanear el QR de nuevo.')) {
            doAction('logout');
        }
    };

    return (
        <Container size="sm" py="md">
            <Title order={2} mb="md">
                Bot de WhatsApp
            </Title>

            {loading ? (
                <Group justify="center" py="xl">
                    <Loader />
                </Group>
            ) : (
                <Stack gap="md">
                    {status?.error && (
                        <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light">
                            {status.error}
                        </Alert>
                    )}

                    <Paper p="md" radius="md" withBorder>
                        <Group justify="space-between">
                            <Text fw={500}>Estado</Text>
                            <Group gap="xs">
                                <Badge color={status?.connected ? 'teal' : 'gray'} variant="light">
                                    {status?.connected ? 'Conectado' : 'Desconectado'}
                                </Badge>
                                <Badge color={status?.loggedIn ? 'teal' : 'orange'} variant="light">
                                    {status?.loggedIn ? 'Vinculado' : 'Sin vincular'}
                                </Badge>
                            </Group>
                        </Group>
                    </Paper>

                    {!status?.loggedIn && (
                        <Paper p="md" radius="md" withBorder>
                            <Group gap="xs" mb="sm">
                                <IconQrcode size={20} />
                                <Text fw={500}>Vincular dispositivo</Text>
                            </Group>
                            {status?.qr ? (
                                <Stack align="center" gap="xs">
                                    <Image
                                        src={`data:image/png;base64,${status.qr}`}
                                        alt="QR de WhatsApp"
                                        w={260}
                                        h={260}
                                    />
                                    <Text size="sm" c="dimmed" ta="center">
                                        WhatsApp → Dispositivos vinculados → Vincular un dispositivo. El QR se refresca solo.
                                    </Text>
                                </Stack>
                            ) : (
                                <Text size="sm" c="dimmed">
                                    Esperando QR del bot… (puede tardar unos segundos)
                                </Text>
                            )}
                        </Paper>
                    )}

                    <Group>
                        <Button
                            leftSection={<IconRefresh size={18} />}
                            variant="default"
                            loading={acting}
                            onClick={() => doAction('restart')}
                        >
                            Reiniciar bot
                        </Button>
                        <Button
                            leftSection={<IconLogout size={18} />}
                            color="red"
                            variant="light"
                            loading={acting}
                            onClick={confirmLogout}
                        >
                            Cerrar sesión / borrar
                        </Button>
                    </Group>
                </Stack>
            )}
        </Container>
    );
}
