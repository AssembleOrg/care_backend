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
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inFlightRef = useRef(false);

    // Una sola pasada de fetch, con guard anti-solapamiento.
    const fetchStatus = useCallback(async (): Promise<BotStatus | null> => {
        if (inFlightRef.current) return null;
        inFlightRef.current = true;
        try {
            const res = await fetch('/api/v1/whatsapp-bot', { cache: 'no-store' });
            const data = await res.json();
            setStatus(data);
            return data;
        } catch {
            const fallback = { connected: false, loggedIn: false, qr: null, error: 'Sin conexión con el bot.' };
            setStatus(fallback);
            return fallback;
        } finally {
            inFlightRef.current = false;
            setLoading(false);
        }
    }, []);

    // Poll adaptativo y auto-detenido:
    //  - vinculado            -> 20s (solo chequeo de salud)
    //  - esperando QR/scan    -> 3s
    //  - pestaña oculta       -> no pollea (ahorra requests)
    useEffect(() => {
        let cancelled = false;

        const schedule = (data: BotStatus | null) => {
            if (cancelled) return;
            const delay = data?.loggedIn ? 20000 : 3000;
            timerRef.current = setTimeout(loop, delay);
        };

        const loop = async () => {
            if (cancelled) return;
            if (typeof document !== 'undefined' && document.hidden) {
                schedule(status); // pestaña oculta: reintenta luego sin pegarle
                return;
            }
            const data = await fetchStatus();
            schedule(data);
        };

        loop();

        // Al volver a la pestaña, refrescar ya.
        const onVisible = () => {
            if (!document.hidden) {
                if (timerRef.current) clearTimeout(timerRef.current);
                loop();
            }
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            cancelled = true;
            if (timerRef.current) clearTimeout(timerRef.current);
            document.removeEventListener('visibilitychange', onVisible);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
