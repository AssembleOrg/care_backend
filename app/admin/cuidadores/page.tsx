'use client';

import { Container, Title, Button, Table, Modal, TextInput, Stack, Group, ActionIcon, Pagination, Paper, Card, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconSearch, IconEdit, IconEye } from '@tabler/icons-react';
import { ViewToggle, useViewMode } from '../components/ViewToggle';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { extractApiErrorMessage, parseApiError } from '../utils/parseApiError';
import cardStyles from '../components/card-view.module.css';

interface Cuidador {
  id: string;
  nombreCompleto: string;
  dni?: string | null;
  telefono?: string | null;
  email?: string | null;
  createdAt: string;
}

interface PaginatedResponse {
  data: Cuidador[];
  total: number;
  page: number;
  limit: number;
}

export default function CuidadoresPage() {
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [selectedCuidador, setSelectedCuidador] = useState<Cuidador | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useViewMode('list');
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const form = useForm({
    initialValues: {
      nombreCompleto: '',
      dni: '',
      telefono: '',
      email: '',
    },
  });

  const fetchCuidadores = async (currentPage: number = page, searchTerm?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
      });
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/v1/cuidadores?${params}`);
      const data = await response.json();
      if (data.ok) {
        const result = data.data as PaginatedResponse;
        setCuidadores(result.data);
        setTotal(result.total);
        setPage(result.page);
      }
    } catch (error) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message: message || 'Error al cargar cuidadores',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuidadores(1, search);
  }, [search]);

  const handleSearch = async () => {
    setSearching(true);
    setSearch(searchInput);
    setPage(1);
    // Wait a bit for the search to complete
    setTimeout(() => setSearching(false), 500);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCuidadores(newPage, search);
  };

  const totalPages = useMemo(() => Math.ceil(total / 20), [total]);

  const handleSubmit = async (values: typeof form.values) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/cuidadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(extractApiErrorMessage(data) || 'Error al crear cuidador');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Cuidador creado correctamente',
        color: 'green',
      });

      form.reset();
      close();
      fetchCuidadores(page, search);
    } catch (error: unknown) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (cuidador: Cuidador) => {
    setSelectedCuidador(cuidador);
    form.setValues({
      nombreCompleto: cuidador.nombreCompleto,
      dni: cuidador.dni || '',
      telefono: cuidador.telefono || '',
      email: cuidador.email || '',
    });
    openEdit();
  };

  const handleView = async (id: string) => {
    setViewing(id);
    try {
      const response = await fetch(`/api/v1/cuidadores/${id}`);
      const data = await response.json();
      if (data.ok) {
        setSelectedCuidador(data.data);
        openView();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      notifications.show({
        title: 'Error',
        message: 'Error al cargar datos del cuidador',
        color: 'red',
      });
    } finally {
      setViewing(null);
    }
  };

  const handleUpdate = async (values: typeof form.values) => {
    if (!selectedCuidador) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/v1/cuidadores/${selectedCuidador.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(extractApiErrorMessage(data) || 'Error al actualizar cuidador');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Cuidador actualizado correctamente',
        color: 'green',
      });

      form.reset();
      setSelectedCuidador(null);
      closeEdit();
      fetchCuidadores(page, search);
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

  const handleDeleteClick = (id: string, nombre: string) => {
    setItemToDelete({ id, name: nombre });
    openDeleteModal();
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    setDeleting(itemToDelete.id);
    try {
      const response = await fetch(`/api/v1/cuidadores/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(extractApiErrorMessage(data) || 'Error al eliminar cuidador');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Cuidador eliminado correctamente',
        color: 'green',
      });

      closeDeleteModal();
      setItemToDelete(null);
      fetchCuidadores(page, search);
    } catch (error: unknown) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Cuidadores</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open} color="fucsia">
          Nuevo Cuidador
        </Button>
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
              <Table.Th>Nombre</Table.Th>
              <Table.Th>DNI</Table.Th>
              <Table.Th>Teléfono</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {cuidadores.map((cuidador) => (
              <Table.Tr key={cuidador.id}>
                <Table.Td>{cuidador.nombreCompleto}</Table.Td>
                <Table.Td>{cuidador.dni || '-'}</Table.Td>
                <Table.Td>{cuidador.telefono || '-'}</Table.Td>
                <Table.Td>{cuidador.email || '-'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                  <ActionIcon 
                    color="blue" 
                    variant="light" 
                    onClick={() => handleView(cuidador.id)}
                    loading={viewing === cuidador.id}
                    disabled={viewing === cuidador.id || deleting === cuidador.id}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    color="orange" 
                    variant="light" 
                    onClick={() => handleEdit(cuidador)}
                    disabled={viewing === cuidador.id || deleting === cuidador.id}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    color="red" 
                    variant="light" 
                    onClick={() => handleDeleteClick(cuidador.id, cuidador.nombreCompleto)}
                    loading={deleting === cuidador.id}
                    disabled={viewing === cuidador.id || deleting === cuidador.id}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <div className={cardStyles.cardGrid}>
          {cuidadores.map((cuidador) => (
            <div key={cuidador.id} className={cardStyles.cardItem}>
              <div className={cardStyles.cardHeader}>
                <h3 className={cardStyles.cardTitle}>{cuidador.nombreCompleto}</h3>
                <Group gap="xs" className={cardStyles.cardActions}>
                  <ActionIcon 
                    color="blue" 
                    variant="light" 
                    size="sm" 
                    onClick={() => handleView(cuidador.id)}
                    loading={viewing === cuidador.id}
                    disabled={viewing === cuidador.id || deleting === cuidador.id}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    color="orange" 
                    variant="light" 
                    size="sm" 
                    onClick={() => handleEdit(cuidador)}
                    disabled={viewing === cuidador.id || deleting === cuidador.id}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    color="red" 
                    variant="light" 
                    size="sm" 
                    onClick={() => handleDelete(cuidador.id)}
                    loading={deleting === cuidador.id}
                    disabled={viewing === cuidador.id || deleting === cuidador.id}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </div>
              <div className={cardStyles.cardBody}>
                <div className={cardStyles.cardField}>
                  <span className={cardStyles.cardFieldLabel}>DNI</span>
                  <span className={cuidador.dni ? cardStyles.cardFieldValue : cardStyles.cardFieldValueEmpty}>
                    {cuidador.dni || 'No especificado'}
                  </span>
                </div>
                <div className={cardStyles.cardField}>
                  <span className={cardStyles.cardFieldLabel}>Teléfono</span>
                  <span className={cuidador.telefono ? cardStyles.cardFieldValue : cardStyles.cardFieldValueEmpty}>
                    {cuidador.telefono || 'No especificado'}
                  </span>
                </div>
                <div className={cardStyles.cardField}>
                  <span className={cardStyles.cardFieldLabel}>Email</span>
                  <span className={cuidador.email ? cardStyles.cardFieldValue : cardStyles.cardFieldValueEmpty}>
                    {cuidador.email || 'No especificado'}
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

      <Modal opened={opened} onClose={close} title="Nuevo Cuidador">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Nombre Completo" required {...form.getInputProps('nombreCompleto')} />
            <TextInput label="DNI" {...form.getInputProps('dni')} />
            <TextInput label="Teléfono" {...form.getInputProps('telefono')} />
            <TextInput label="Email" type="email" {...form.getInputProps('email')} />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={close}>
                Cancelar
              </Button>
              <Button type="submit" color="fucsia" loading={submitting} disabled={submitting}>
                Crear
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={editOpened} onClose={closeEdit} title="Editar Cuidador">
        <form onSubmit={form.onSubmit(handleUpdate)}>
          <Stack>
            <TextInput label="Nombre Completo" required {...form.getInputProps('nombreCompleto')} />
            <TextInput label="DNI" {...form.getInputProps('dni')} />
            <TextInput label="Teléfono" {...form.getInputProps('telefono')} />
            <TextInput label="Email" type="email" {...form.getInputProps('email')} />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeEdit}>
                Cancelar
              </Button>
              <Button type="submit" color="fucsia" loading={updating} disabled={updating}>
                Guardar
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={viewOpened} onClose={closeView} title="Ver Cuidador">
        {selectedCuidador && (
          <Stack>
            <TextInput label="Nombre Completo" value={selectedCuidador.nombreCompleto} readOnly />
            <TextInput label="DNI" value={selectedCuidador.dni || '-'} readOnly />
            <TextInput label="Teléfono" value={selectedCuidador.telefono || '-'} readOnly />
            <TextInput label="Email" value={selectedCuidador.email || '-'} readOnly />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeView}>
                Cerrar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <ConfirmDeleteModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Cuidador"
        message="¿Estás seguro de que deseas eliminar este cuidador?"
        itemName={itemToDelete?.name}
        loading={deleting !== null}
      />
    </Container>
  );
}
