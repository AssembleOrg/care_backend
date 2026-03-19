'use client';

import { Container, Title, Table, Modal, TextInput, Stack, Group, ActionIcon, Pagination, Paper, Select, Button, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconSearch, IconEye, IconEdit } from '@tabler/icons-react';
import { ViewToggle, useViewMode } from '../components/ViewToggle';
import { parseApiError } from '../utils/parseApiError';
import cardStyles from '../components/card-view.module.css';
import { EstadoSolicitud } from '@/src/domain/entities/EstadoSolicitud';

interface SolicitudEmpleo {
    id: string;
    nombre: string;
    apellido: string;
    zonaTrabajo: string;
    telefono: string | null;
    email: string | null;
    estado: EstadoSolicitud;
    createdAt: string;
}

interface PaginatedResponse {
    data: SolicitudEmpleo[];
    total: number;
    page: number;
    limit: number;
}

const getEstadoColor = (estado: EstadoSolicitud) => {
    switch (estado) {
        case EstadoSolicitud.ABIERTA:
            return 'blue';
        case EstadoSolicitud.RECIEN_RECIBIDA:
            return 'orange';
        case EstadoSolicitud.CERRADA:
            return 'gray';
        default:
            return 'gray';
    }
};

export default function SolicitudesEmpleoPage() {
    const [solicitudes, setSolicitudes] = useState<SolicitudEmpleo[]>([]);
    const [loading, setLoading] = useState(true);

    const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
    const [editStateOpened, { open: openEditState, close: closeEditState }] = useDisclosure(false);

    const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEmpleo | null>(null);
    const [newState, setNewState] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [viewMode, setViewMode] = useViewMode('list');
    const [updating, setUpdating] = useState(false);
    const [searching, setSearching] = useState(false);

    const fetchSolicitudes = async (currentPage: number = page, searchTerm?: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(currentPage),
                limit: '20',
            });
            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await fetch(`/api/v1/solicitudes-empleo?${params}`);
            const result = await response.json();

            if (result.data) {
                setSolicitudes(result.data);
                setTotal(result.total);
                setPage(result.page);
            } else if (Array.isArray(result)) {
                setSolicitudes(result);
                setTotal(result.length);
            }
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Error al cargar las solicitudes',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSolicitudes(1, search);
    }, [search]);

    const handleSearch = async () => {
        setSearching(true);
        setSearch(searchInput);
        setPage(1);
        setTimeout(() => setSearching(false), 500);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchSolicitudes(newPage, search);
    };

    const totalPages = useMemo(() => Math.ceil(total / 20), [total]);

    const handleView = (solicitud: SolicitudEmpleo) => {
        setSelectedSolicitud(solicitud);
        openView();
    };

    const handleEditClick = (solicitud: SolicitudEmpleo) => {
        setSelectedSolicitud(solicitud);
        setNewState(solicitud.estado);
        openEditState();
    };

    const handleUpdateState = async () => {
        if (!selectedSolicitud || !newState) return;

        setUpdating(true);
        try {
            const response = await fetch(`/api/v1/solicitudes-empleo/${selectedSolicitud.id}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newState }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al actualizar estado');
            }

            notifications.show({
                title: 'Éxito',
                message: 'Estado de la solicitud actualizado correctamente',
                color: 'green',
            });

            closeEditState();
            setSelectedSolicitud(null);
            fetchSolicitudes(page, search);
        } catch (error: unknown) {
            const message = parseApiError(error);
            notifications.show({
                title: 'Error',
                message,
                color: 'red',
            });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <Title order={1}>Solicitudes de Empleo</Title>
            </Group>

            <Paper p="md" withBorder mb="md">
                <Group>
                    <TextInput
                        placeholder="Buscar por nombre o apellido..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{ flex: 1 }}
                        leftSection={<IconSearch size={16} />}
                    />
                    <Button onClick={handleSearch} loading={searching}>Buscar</Button>
                    {search && (
                        <Button variant="subtle" onClick={() => {
                            setSearch('');
                            setSearchInput('');
                            setPage(1);
                        }}>
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
                            <Table.Th>Nombre Completo</Table.Th>
                            <Table.Th>Zona de Trabajo</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Teléfono</Table.Th>
                            <Table.Th>Fecha de Envío</Table.Th>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {solicitudes.map((solicitud) => (
                            <Table.Tr key={solicitud.id}>
                                <Table.Td>{solicitud.nombre} {solicitud.apellido}</Table.Td>
                                <Table.Td>{solicitud.zonaTrabajo}</Table.Td>
                                <Table.Td>{solicitud.email || '-'}</Table.Td>
                                <Table.Td>{solicitud.telefono || '-'}</Table.Td>
                                <Table.Td>{new Date(solicitud.createdAt).toLocaleDateString()}</Table.Td>
                                <Table.Td>
                                    <Badge color={getEstadoColor(solicitud.estado)} variant="light">
                                        {solicitud.estado.replace('_', ' ')}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs">
                                        <ActionIcon
                                            color="blue"
                                            variant="light"
                                            onClick={() => handleView(solicitud)}
                                        >
                                            <IconEye size={16} />
                                        </ActionIcon>
                                        <ActionIcon
                                            color="orange"
                                            variant="light"
                                            onClick={() => handleEditClick(solicitud)}
                                        >
                                            <IconEdit size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                        {solicitudes.length === 0 && !loading && (
                            <Table.Tr>
                                <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
                                    No hay solicitudes registradas
                                </Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            ) : (
                <div className={cardStyles.cardGrid}>
                    {solicitudes.map((solicitud) => (
                        <div key={solicitud.id} className={cardStyles.cardItem}>
                            <div className={cardStyles.cardHeader}>
                                <h3 className={cardStyles.cardTitle}>{solicitud.nombre} {solicitud.apellido}</h3>
                                <Group gap="xs" className={cardStyles.cardActions}>
                                    <ActionIcon color="blue" variant="light" size="sm" onClick={() => handleView(solicitud)}>
                                        <IconEye size={16} />
                                    </ActionIcon>
                                    <ActionIcon color="orange" variant="light" size="sm" onClick={() => handleEditClick(solicitud)}>
                                        <IconEdit size={16} />
                                    </ActionIcon>
                                </Group>
                            </div>
                            <div className={cardStyles.cardBody}>
                                <div className={cardStyles.cardField}>
                                    <span className={cardStyles.cardFieldLabel}>Estado</span>
                                    <Badge color={getEstadoColor(solicitud.estado)} variant="light" size="sm">
                                        {solicitud.estado.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className={cardStyles.cardField}>
                                    <span className={cardStyles.cardFieldLabel}>Zona</span>
                                    <span className={cardStyles.cardFieldValue}>{solicitud.zonaTrabajo}</span>
                                </div>
                                <div className={cardStyles.cardField}>
                                    <span className={cardStyles.cardFieldLabel}>Email</span>
                                    <span className={solicitud.email ? cardStyles.cardFieldValue : cardStyles.cardFieldValueEmpty}>
                                        {solicitud.email || 'No especificado'}
                                    </span>
                                </div>
                                <div className={cardStyles.cardField}>
                                    <span className={cardStyles.cardFieldLabel}>Teléfono</span>
                                    <span className={solicitud.telefono ? cardStyles.cardFieldValue : cardStyles.cardFieldValueEmpty}>
                                        {solicitud.telefono || 'No especificado'}
                                    </span>
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
            <Modal opened={viewOpened} onClose={closeView} title="Detalles de Solicitud de Empleo">
                {selectedSolicitud && (
                    <Stack>
                        <TextInput label="Nombre Completo" value={`${selectedSolicitud.nombre} ${selectedSolicitud.apellido}`} readOnly />
                        <TextInput label="Zona de Trabajo" value={selectedSolicitud.zonaTrabajo} readOnly />
                        <TextInput label="Teléfono" value={selectedSolicitud.telefono || '-'} readOnly />
                        <TextInput label="Email" value={selectedSolicitud.email || '-'} readOnly />
                        <TextInput label="Fecha de Envío" value={new Date(selectedSolicitud.createdAt).toLocaleString()} readOnly />
                        <TextInput label="Estado Actual" value={selectedSolicitud.estado.replace('_', ' ')} readOnly />

                        <Group justify="flex-end" mt="md">
                            <Button variant="subtle" onClick={closeView}>Cerrar</Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {/* Modal Cambiar Estado */}
            <Modal opened={editStateOpened} onClose={closeEditState} title="Modificar Estado">
                {selectedSolicitud && (
                    <Stack>
                        <Select
                            label="Cambiar Estado de Solicitud"
                            data={[
                                { value: EstadoSolicitud.ABIERTA, label: 'Abierta' },
                                { value: EstadoSolicitud.RECIEN_RECIBIDA, label: 'Recién Recibida' },
                                { value: EstadoSolicitud.CERRADA, label: 'Cerrada' },
                            ]}
                            value={newState}
                            onChange={setNewState}
                            required
                        />
                        <Group justify="flex-end" mt="md">
                            <Button variant="subtle" onClick={closeEditState}>Cancelar</Button>
                            <Button onClick={handleUpdateState} color="fucsia" loading={updating} disabled={updating}>
                                Guardar
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Container>
    );
}
