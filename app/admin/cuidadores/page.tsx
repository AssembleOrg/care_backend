'use client';

import { Container, Title, Button, Table, Modal, TextInput, Stack, Group, ActionIcon, Pagination, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash, IconSearch, IconEdit, IconEye } from '@tabler/icons-react';

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
      notifications.show({
        title: 'Error',
        message: 'Error al cargar cuidadores',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuidadores(1, search);
  }, [search]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCuidadores(newPage, search);
  };

  const totalPages = useMemo(() => Math.ceil(total / 20), [total]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const response = await fetch('/api/v1/cuidadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || 'Error al crear cuidador');
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
      const message = error instanceof Error ? error.message : 'Error desconocido';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
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
    }
  };

  const handleUpdate = async (values: typeof form.values) => {
    if (!selectedCuidador) return;

    try {
      const response = await fetch(`/api/v1/cuidadores/${selectedCuidador.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || 'Error al actualizar cuidador');
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
      const message = error instanceof Error ? error.message : 'Error desconocido';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cuidador?')) return;

    try {
      const response = await fetch(`/api/v1/cuidadores/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || 'Error al eliminar cuidador');
      }

      notifications.show({
        title: 'Éxito',
        message: 'Cuidador eliminado correctamente',
        color: 'green',
      });

      fetchCuidadores(page, search);
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
                  <ActionIcon color="blue" variant="light" onClick={() => handleView(cuidador.id)}>
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon color="orange" variant="light" onClick={() => handleEdit(cuidador)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon color="red" variant="light" onClick={() => handleDelete(cuidador.id)}>
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
              <Button type="submit" color="fucsia">
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
              <Button type="submit" color="fucsia">
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
    </Container>
  );
}
