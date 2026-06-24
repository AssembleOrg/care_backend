'use client';

import { Container, Title, Table, Modal, TextInput, Textarea, Stack, Group, ActionIcon, Pagination, Paper, Button, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconEye, IconMail, IconMailOpened } from '@tabler/icons-react';
import { ViewToggle, useViewMode } from '../components/ViewToggle';
import { parseApiError } from '../utils/parseApiError';
import { formatDateTime } from '../utils/formatDate';
import { REALTIME_EVENTS } from '../layout';
import cardStyles from '../components/card-view.module.css';

interface MensajeContacto {
    id: string;
    nombre: string;
    telefono: string | null;
    email: string | null;
    mensaje: string | null;
    leido: boolean;
    createdAt: string;
}

export default function ContactoPage() {
    const [mensajes, setMensajes] = useState<MensajeContacto[]>([]);
    const [loading, setLoading] = useState(true);

    const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
    const [selected, setSelected] = useState<MensajeContacto | null>(null);

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [viewMode, setViewMode] = useViewMode('list');
    const [searching, setSearching] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchMensajes = async (currentPage: number = page, searchTerm?: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page: String(currentPage), limit: '20' });
            if (searchTerm) params.append('search', searchTerm);

            const response = await fetch(`/api/v1/contacto?${params}`);
            const result = await response.json();

            if (result.data) {
                setMensajes(result.data);
                setTotal(result.total);
                setPage(result.page);
            } else if (Array.isArray(result)) {
                setMensajes(result);
                setTotal(result.length);
            }
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Error al cargar los mensajes', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMensajes(1, search);
    }, [search]);

    // Refrescar en vivo cuando llega un mensaje nuevo (realtime desde el layout)
    useEffect(() => {
        const onNuevo = () => fetchMensajes(1, search);
        window.addEventListener(REALTIME_EVENTS.contacto, onNuevo);
        return () => window.removeEventListener(REALTIME_EVENTS.contacto, onNuevo);
    }, [search]);

    const handleSearch = async () => {
        setSearching(true);
        setSearch(searchInput);
        setPage(1);
        setTimeout(() => setSearching(false), 500);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchMensajes(newPage, search);
    };

    const totalPages = useMemo(() => Math.ceil(total / 20), [total]);

    const handleView = (mensaje: MensajeContacto) => {
        setSelected(mensaje);
        openView();
        if (!mensaje.leido) toggleLeido(mensaje, true, false);
    };

    const toggleLeido = async (mensaje: MensajeContacto, leido: boolean, notify = true) => {
        setUpdatingId(mensaje.id);
        try {
            const response = await fetch(`/api/v1/contacto/${mensaje.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leido }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al actualizar');

            setMensajes((prev) => prev.map((m) => (m.id === mensaje.id ? { ...m, leido } : m)));
            if (selected?.id === mensaje.id) setSelected({ ...selected, leido });
            window.dispatchEvent(new CustomEvent(REALTIME_EVENTS.refreshBadges));
            if (notify) {
                notifications.show({ title: 'Éxito', message: leido ? 'Marcado como leído' : 'Marcado como no leído', color: 'green' });
            }
        } catch (error: unknown) {
            notifications.show({ title: 'Error', message: parseApiError(error), color: 'red' });
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <Title order={1}>Mensajes de Contacto</Title>
            </Group>

            <Paper p="md" withBorder mb="md">
                <Group>
                    <TextInput
                        placeholder="Buscar por nombre..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{ flex: 1 }}
                        leftSection={<IconSearch size={16} />}
                    />
                    <Button onClick={handleSearch} loading={searching}>Buscar</Button>
                    {search && (
                        <Button variant="subtle" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
                            Limpiar
                        </Button>
                    )}
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                </Group>
            </Paper>

            {viewMode === 'list' ? (
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Nombre</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Teléfono</Table.Th>
                            <Table.Th>Fecha de Envío</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {mensajes.map((mensaje) => (
                            <Table.Tr key={mensaje.id} style={{ fontWeight: mensaje.leido ? 400 : 600 }}>
                                <Table.Td>
                                    <Badge color={mensaje.leido ? 'gray' : 'blue'} variant="light">
                                        {mensaje.leido ? 'Leído' : 'Nuevo'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>{mensaje.nombre}</Table.Td>
                                <Table.Td>{mensaje.email || '-'}</Table.Td>
                                <Table.Td>{mensaje.telefono || '-'}</Table.Td>
                                <Table.Td>{formatDateTime(mensaje.createdAt)}</Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <ActionIcon color="blue" variant="light" onClick={() => handleView(mensaje)}>
                                            <IconEye size={16} />
                                        </ActionIcon>
                                        <ActionIcon
                                            color={mensaje.leido ? 'orange' : 'green'}
                                            variant="light"
                                            loading={updatingId === mensaje.id}
                                            onClick={() => toggleLeido(mensaje, !mensaje.leido)}
                                            title={mensaje.leido ? 'Marcar como no leído' : 'Marcar como leído'}
                                        >
                                            {mensaje.leido ? <IconMail size={16} /> : <IconMailOpened size={16} />}
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                        {mensajes.length === 0 && !loading && (
                            <Table.Tr>
                                <Table.Td colSpan={6} style={{ textAlign: 'center' }}>
                                    No hay mensajes registrados
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            ) : (
                <div className={cardStyles.cardGrid}>
                    {mensajes.map((mensaje) => (
                        <div key={mensaje.id} className={cardStyles.cardItem}>
                            <div className={cardStyles.cardHeader}>
                                <h3 className={cardStyles.cardTitle}>{mensaje.nombre}</h3>
                                <Group gap="xs" className={cardStyles.cardActions}>
                                    <ActionIcon color="blue" variant="light" size="sm" onClick={() => handleView(mensaje)}>
                                        <IconEye size={16} />
                                    </ActionIcon>
                                    <ActionIcon
                                        color={mensaje.leido ? 'orange' : 'green'}
                                        variant="light"
                                        size="sm"
                                        loading={updatingId === mensaje.id}
                                        onClick={() => toggleLeido(mensaje, !mensaje.leido)}
                                    >
                                        {mensaje.leido ? <IconMail size={16} /> : <IconMailOpened size={16} />}
                                    </ActionIcon>
                                </Group>
                            </div>
                            <div className={cardStyles.cardBody}>
                                <div className={cardStyles.cardField}>
                                    <span className={cardStyles.cardFieldLabel}>Estado</span>
                                    <Badge color={mensaje.leido ? 'gray' : 'blue'} variant="light" size="sm">
                                        {mensaje.leido ? 'Leído' : 'Nuevo'}
                                    </Badge>
                                </div>
                                <div className={cardStyles.cardField}>
                                    <span className={cardStyles.cardFieldLabel}>Email</span>
                                    <span className={mensaje.email ? cardStyles.cardFieldValue : cardStyles.cardFieldValueEmpty}>
                                        {mensaje.email || 'No especificado'}
                                    </span>
                                </div>
                                <div className={cardStyles.cardField}>
                                    <span className={cardStyles.cardFieldLabel}>Teléfono</span>
                                    <span className={mensaje.telefono ? cardStyles.cardFieldValue : cardStyles.cardFieldValueEmpty}>
                                        {mensaje.telefono || 'No especificado'}
                                    </span>
                                </div>
                                <div className={cardStyles.cardField}>
                                    <span className={cardStyles.cardFieldLabel}>Fecha</span>
                                    <span className={cardStyles.cardFieldValue}>{formatDateTime(mensaje.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Group justify="center" mt="xl">
                <Pagination value={page} onChange={handlePageChange} total={Math.max(totalPages, 1)} />
            </Group>

            {/* Modal Ver Detalles */}
            <Modal opened={viewOpened} onClose={closeView} title="Mensaje de Contacto" size="lg">
                {selected && (
                    <Stack>
                        <TextInput label="Nombre" value={selected.nombre} readOnly />
                        <TextInput label="Email" value={selected.email || '-'} readOnly />
                        <TextInput label="Teléfono" value={selected.telefono || '-'} readOnly />
                        <Textarea label="Mensaje" value={selected.mensaje || '-'} readOnly autosize minRows={3} />
                        <TextInput label="Fecha de Envío" value={formatDateTime(selected.createdAt)} readOnly />
                        <Group justify="flex-end" mt="md">
                            <Button variant="subtle" onClick={closeView}>Cerrar</Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Container>
    );
}
