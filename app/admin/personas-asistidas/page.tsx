'use client';

import { Container, Title, Button, Table, Modal, TextInput, Stack, Group, ActionIcon, Pagination, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconSearch, IconEdit, IconEye } from '@tabler/icons-react';

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
      notifications.show({
        title: 'Error',
        message: 'Error al cargar personas asistidas',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas(1, search);
  }, [search]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPersonas(newPage, search);
  };

  const totalPages = useMemo(() => Math.ceil(total / 20), [total]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const response = await fetch('/api/v1/personas-asistidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || 'Error al crear persona asistida');
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
      const message = error instanceof Error ? error.message : 'Error desconocido';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
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
    try {
      const response = await fetch(`/api/v1/personas-asistidas/${id}`);
      const data = await response.json();
      if (data.ok) {
        setSelectedPersona(data.data);
        openView();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      notifications.show({
        title: 'Error',
        message: 'Error al cargar datos de la persona asistida',
        color: 'red',
      });
    }
  };

  const handleUpdate = async (values: typeof form.values) => {
    if (!selectedPersona) return;

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
      const message = error instanceof Error ? error.message : 'Error desconocido';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta persona asistida?')) return;

    try {
      const response = await fetch(`/api/v1/personas-asistidas/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || 'Error al eliminar persona asistida');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Persona asistida eliminada correctamente',
        color: 'green',
      });

      fetchPersonas(page, search);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
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
          <Button onClick={handleSearch}>Buscar</Button>
          {search && (
            <Button variant="subtle" onClick={() => {
              setSearch('');
              setSearchInput('');
              setPage(1);
            }}>
              Limpiar
            </Button>
          )}
        </Group>
      </Paper>

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
                  <ActionIcon color="blue" variant="light" onClick={() => handleView(persona.id)}>
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon color="orange" variant="light" onClick={() => handleEdit(persona)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon color="red" variant="light" onClick={() => handleDelete(persona.id)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

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
              <Button type="submit" color="fucsia">
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
              <Button type="submit" color="fucsia">
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
    </Container>
  );
}
