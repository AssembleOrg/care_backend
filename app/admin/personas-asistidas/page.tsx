'use client';

import { Container, Title, Button, Table, Modal, TextInput, Stack, Group, ActionIcon, Pagination, Paper, Badge, Text, MultiSelect } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconSearch, IconEdit, IconEye, IconX } from '@tabler/icons-react';
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
  const [cuidadores, setCuidadores] = useState<Array<{ id: string; nombreCompleto: string }>>([]);
  const [cuidadoresPersona, setCuidadoresPersona] = useState<Array<{ id: string; cuidadorId: string; cuidadorNombre: string; activo: boolean }>>([]);
  const [cuidadoresModalOpened, { open: openCuidadoresModal, close: closeCuidadoresModal }] = useDisclosure(false);
  const [personaIdParaCuidadores, setPersonaIdParaCuidadores] = useState<string | null>(null);

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
    // Cargar cuidadores para el select
    fetch('/api/v1/cuidadores?all=true')
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.data)) {
          setCuidadores(data.data);
        }
      })
      .catch(err => console.error('Error fetching cuidadores:', err));
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
        body: JSON.stringify({
          nombreCompleto: values.nombreCompleto,
          dni: values.dni || undefined,
          telefono: values.telefono || undefined,
          direccion: values.direccion || undefined,
          telefonoContactoEmergencia: values.telefonoContactoEmergencia || undefined,
        }),
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
      const [personaResponse, cuidadoresResponse] = await Promise.all([
        fetch(`/api/v1/personas-asistidas/${id}`),
        fetch(`/api/v1/personas-asistidas/${id}/cuidadores`),
      ]);
      
      const personaData = await personaResponse.json();
      const cuidadoresData = await cuidadoresResponse.json();
      
      if (personaData.ok) {
        setSelectedPersona(personaData.data);
        if (cuidadoresData.ok) {
          setCuidadoresPersona(cuidadoresData.data);
        }
        openView();
      } else {
        throw new Error(extractApiErrorMessage(personaData) || 'Error al cargar datos de la persona asistida');
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

  const handleGestionarCuidadores = async (id: string) => {
    setPersonaIdParaCuidadores(id);
    try {
      const response = await fetch(`/api/v1/personas-asistidas/${id}/cuidadores`);
      const data = await response.json();
      if (data.ok) {
        setCuidadoresPersona(data.data);
        openCuidadoresModal();
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar cuidadores',
        color: 'red',
      });
    }
  };

  const handleAgregarCuidador = async (cuidadorId: string) => {
    if (!personaIdParaCuidadores) return;
    
    try {
      const response = await fetch(`/api/v1/personas-asistidas/${personaIdParaCuidadores}/cuidadores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuidadorId }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.ok) {
        throw new Error(extractApiErrorMessage(data) || 'Error al agregar cuidador');
      }
      
      notifications.show({
        title: 'Éxito',
        message: 'Cuidador agregado correctamente',
        color: 'green',
      });
      
      // Recargar lista
      const listResponse = await fetch(`/api/v1/personas-asistidas/${personaIdParaCuidadores}/cuidadores`);
      const listData = await listResponse.json();
      if (listData.ok) {
        setCuidadoresPersona(listData.data);
      }
    } catch (error: unknown) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    }
  };

  const handleEliminarCuidador = async (cuidadorId: string) => {
    if (!personaIdParaCuidadores) return;
    
    try {
      const response = await fetch(`/api/v1/personas-asistidas/${personaIdParaCuidadores}/cuidadores/${cuidadorId}`, {
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
      
      // Recargar lista
      const listResponse = await fetch(`/api/v1/personas-asistidas/${personaIdParaCuidadores}/cuidadores`);
      const listData = await listResponse.json();
      if (listData.ok) {
        setCuidadoresPersona(listData.data);
      }
    } catch (error: unknown) {
      const message = parseApiError(error);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
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

      <Modal opened={opened} onClose={close} title="Nueva Persona Asistida" size="lg">
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

      <Modal opened={viewOpened} onClose={closeView} title="Ver Persona Asistida" size="lg">
        {selectedPersona && (
          <Stack>
            <TextInput label="Nombre Completo" value={selectedPersona.nombreCompleto} readOnly />
            <TextInput label="DNI" value={selectedPersona.dni || '-'} readOnly />
            <TextInput label="Teléfono" value={selectedPersona.telefono || '-'} readOnly />
            <TextInput label="Dirección" value={selectedPersona.direccion || '-'} readOnly />
            <TextInput label="Teléfono Contacto Emergencia" value={selectedPersona.telefonoContactoEmergencia || '-'} readOnly />
            
            <Paper p="md" withBorder>
              <Group justify="space-between" mb="md">
                <Text fw={600}>Cuidadores</Text>
                <Button size="xs" onClick={() => handleGestionarCuidadores(selectedPersona.id)}>
                  Gestionar
                </Button>
              </Group>
              <Stack gap="xs">
                {cuidadoresPersona.filter(c => c.activo).length === 0 ? (
                  <Text size="sm" c="dimmed">No hay cuidadores asignados</Text>
                ) : (
                  cuidadoresPersona
                    .filter(c => c.activo)
                    .map(c => (
                      <Badge key={c.id} size="lg" variant="light" color="fucsia">
                        {c.cuidadorNombre}
                      </Badge>
                    ))
                )}
              </Stack>
            </Paper>
            
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeView}>
                Cerrar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Modal opened={cuidadoresModalOpened} onClose={closeCuidadoresModal} title="Gestionar Cuidadores" size="lg">
        {personaIdParaCuidadores && (
          <Stack>
            <MultiSelect
              label="Agregar Cuidador"
              placeholder="Seleccionar cuidador para agregar"
              data={cuidadores
                .filter(c => !cuidadoresPersona.find(pc => pc.cuidadorId === c.id && pc.activo))
                .map(c => ({ value: c.id, label: c.nombreCompleto }))}
              searchable
              onChange={(value) => {
                if (value && value.length > 0) {
                  handleAgregarCuidador(value[value.length - 1]);
                }
              }}
            />
            
            <Paper p="md" withBorder>
              <Text fw={600} mb="md">Cuidadores Asignados</Text>
              <Stack gap="xs">
                {cuidadoresPersona
                  .filter(c => c.activo)
                  .map(c => (
                    <Group key={c.id} justify="space-between">
                      <Badge size="lg" variant="light" color="fucsia">
                        {c.cuidadorNombre}
                      </Badge>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => handleEliminarCuidador(c.cuidadorId)}
                        disabled={cuidadoresPersona.filter(pc => pc.activo).length === 1}
                        title={cuidadoresPersona.filter(pc => pc.activo).length === 1 ? 'No se puede eliminar el último cuidador' : 'Eliminar cuidador'}
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    </Group>
                  ))}
              </Stack>
            </Paper>
            
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeCuidadoresModal}>
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
