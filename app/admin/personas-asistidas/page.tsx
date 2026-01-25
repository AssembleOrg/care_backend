'use client';

import { Container, Title, Button, Table, Modal, TextInput, Stack, Group, ActionIcon, Pagination, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconSearch, IconEdit, IconEye } from '@tabler/icons-react';
import { ViewToggle, useViewMode } from '../components/ViewToggle';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { extractApiErrorMessage, parseApiError } from '../utils/parseApiError';
import cardStyles from '../components/card-view.module.css';

interface PersonaAsistida {
  id: string;
  nombreCompleto: string;
  dni?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  telefonoContactoEmergencia?: string | null;
  createdAt: string;
}

interface PaginatedResponse {
  data: PersonaAsistida[];
  total: number;
  page: number;
  limit: number;
}

export default function PersonasAsistidasPage() {
  const [personas, setPersonas] = useState<PersonaAsistida[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaAsistida | null>(null);
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
      direccion: '',
      telefonoContactoEmergencia: '',
    },
  });

  const fetchPersonas = async (currentPage: number = page, searchTerm?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
      });
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/v1/personas-asistidas?${params}`);
      const data = await response.json();
      if (data.ok) {
        const result = data.data as PaginatedResponse;
        setPersonas(result.data);
        setTotal(result.total);
        setPage(result.page);
      }
    } catch (error) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message: message || 'Error al cargar personas asistidas',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas(1, search);
  }, [search]);

  const handleSearch = async () => {
    setSearching(true);
    setSearch(searchInput);
    setPage(1);
    setTimeout(() => setSearching(false), 500);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPersonas(newPage, search);
  };

  const totalPages = useMemo(() => Math.ceil(total / 20), [total]);

  const handleSubmit = async (values: typeof form.values) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/v1/personas-asistidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(extractApiErrorMessage(data) || 'Error al crear persona asistida');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Persona asistida creada correctamente',
        color: 'green',
      });

      form.reset();
      close();
      fetchPersonas(page, search);
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

  const handleEdit = async (persona: PersonaAsistida) => {
    setSelectedPersona(persona);
    form.setValues({
      nombreCompleto: persona.nombreCompleto,
      dni: persona.dni || '',
      telefono: persona.telefono || '',
      direccion: persona.direccion || '',
      telefonoContactoEmergencia: persona.telefonoContactoEmergencia || '',
    });
    openEdit();
  };

  const handleView = async (id: string) => {
    setViewing(id);
    try {
      const response = await fetch(`/api/v1/personas-asistidas/${id}`);
      const data = await response.json();
      if (data.ok) {
        setSelectedPersona(data.data);
        openView();
      } else {
        throw new Error(extractApiErrorMessage(data) || 'Error al cargar datos de la persona asistida');
      }
    } catch (error: unknown) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message: message || 'Error al cargar datos de la persona asistida',
        color: 'red',
      });
    } finally {
      setViewing(null);
    }
  };

  const handleUpdate = async (values: typeof form.values) => {
    if (!selectedPersona) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/v1/personas-asistidas/${selectedPersona.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || 'Error al actualizar persona asistida');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Persona asistida actualizada correctamente',
        color: 'green',
      });

      form.reset();
      setSelectedPersona(null);
      closeEdit();
      fetchPersonas(page, search);
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
      const response = await fetch(`/api/v1/personas-asistidas/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(extractApiErrorMessage(data) || 'Error al eliminar persona asistida');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Persona asistida eliminada correctamente',
        color: 'green',
      });

      closeDeleteModal();
      setItemToDelete(null);
      fetchPersonas(page, search);
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
        <Title order={1}>Personas Asistidas</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open} color="fucsia">
          Nueva Persona
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
              <Table.Th>Dirección</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {personas.map((persona) => (
              <Table.Tr key={persona.id}>
                <Table.Td>{persona.nombreCompleto}</Table.Td>
                <Table.Td>{persona.dni || '-'}</Table.Td>
                <Table.Td>{persona.telefono || '-'}</Table.Td>
                <Table.Td>{persona.direccion || '-'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                  <ActionIcon 
                    color="blue" 
                    variant="light" 
                    onClick={() => handleView(persona.id)}
                    loading={viewing === persona.id}
                    disabled={viewing === persona.id || deleting === persona.id}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    color="orange" 
                    variant="light" 
                    onClick={() => handleEdit(persona)}
                    disabled={viewing === persona.id || deleting === persona.id}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    color="red" 
                    variant="light" 
                    onClick={() => handleDeleteClick(persona.id, persona.nombreCompleto)}
                    loading={deleting === persona.id}
                    disabled={viewing === persona.id || deleting === persona.id}
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
          {personas.map((persona) => (
            <div key={persona.id} className={cardStyles.cardItem}>
              <div className={cardStyles.cardHeader}>
                <h3 className={cardStyles.cardTitle}>{persona.nombreCompleto}</h3>
                <Group gap="xs" className={cardStyles.cardActions}>
                  <ActionIcon 
                    color="blue" 
                    variant="light" 
                    size="sm" 
                    onClick={() => handleView(persona.id)}
                    loading={viewing === persona.id}
                    disabled={viewing === persona.id || deleting === persona.id}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    color="orange" 
                    variant="light" 
                    size="sm" 
                    onClick={() => handleEdit(persona)}
                    disabled={viewing === persona.id || deleting === persona.id}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon 
                    color="red" 
                    variant="light" 
                    size="sm" 
                    onClick={() => handleDeleteClick(persona.id, persona.nombreCompleto)}
                    loading={deleting === persona.id}
                    disabled={viewing === persona.id || deleting === persona.id}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </div>
              <div className={cardStyles.cardBody}>
                <div className={cardStyles.cardField}>
                  <span className={cardStyles.cardFieldLabel}>DNI</span>
                  <span className={persona.dni ? cardStyles.cardFieldValue : cardStyles.cardFieldValueEmpty}>
                    {persona.dni || 'No especificado'}
                  </span>
                </div>
                <div className={cardStyles.cardField}>
                  <span className={cardStyles.cardFieldLabel}>Teléfono</span>
                  <span className={persona.telefono ? cardStyles.cardFieldValue : cardStyles.cardFieldValueEmpty}>
                    {persona.telefono || 'No especificado'}
                  </span>
                </div>
                <div className={cardStyles.cardField}>
                  <span className={cardStyles.cardFieldLabel}>Dirección</span>
                  <span className={persona.direccion ? cardStyles.cardFieldValue : cardStyles.cardFieldValueEmpty}>
                    {persona.direccion || 'No especificado'}
                  </span>
                </div>
                {persona.telefonoContactoEmergencia && (
                  <div className={cardStyles.cardField}>
                    <span className={cardStyles.cardFieldLabel}>Teléfono Emergencia</span>
                    <span className={cardStyles.cardFieldValue}>
                      {persona.telefonoContactoEmergencia}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Group justify="center" mt="xl">
        <Pagination value={page} onChange={handlePageChange} total={Math.max(totalPages, 1)} />
      </Group>

      <Modal opened={opened} onClose={close} title="Nueva Persona Asistida">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Nombre Completo" required {...form.getInputProps('nombreCompleto')} />
            <TextInput label="DNI" {...form.getInputProps('dni')} />
            <TextInput label="Teléfono" {...form.getInputProps('telefono')} />
            <TextInput label="Dirección" {...form.getInputProps('direccion')} />
            <TextInput label="Teléfono Contacto Emergencia" {...form.getInputProps('telefonoContactoEmergencia')} />
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

      <Modal opened={editOpened} onClose={closeEdit} title="Editar Persona Asistida">
        <form onSubmit={form.onSubmit(handleUpdate)}>
          <Stack>
            <TextInput label="Nombre Completo" required {...form.getInputProps('nombreCompleto')} />
            <TextInput label="DNI" {...form.getInputProps('dni')} />
            <TextInput label="Teléfono" {...form.getInputProps('telefono')} />
            <TextInput label="Dirección" {...form.getInputProps('direccion')} />
            <TextInput label="Teléfono Contacto Emergencia" {...form.getInputProps('telefonoContactoEmergencia')} />
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

      <Modal opened={viewOpened} onClose={closeView} title="Ver Persona Asistida">
        {selectedPersona && (
          <Stack>
            <TextInput label="Nombre Completo" value={selectedPersona.nombreCompleto} readOnly />
            <TextInput label="DNI" value={selectedPersona.dni || '-'} readOnly />
            <TextInput label="Teléfono" value={selectedPersona.telefono || '-'} readOnly />
            <TextInput label="Dirección" value={selectedPersona.direccion || '-'} readOnly />
            <TextInput label="Teléfono Contacto Emergencia" value={selectedPersona.telefonoContactoEmergencia || '-'} readOnly />
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
        title="Eliminar Persona Asistida"
        message="¿Estás seguro de que deseas eliminar esta persona asistida?"
        itemName={itemToDelete?.name}
        loading={deleting !== null}
      />
    </Container>
  );
}
