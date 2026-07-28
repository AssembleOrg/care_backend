'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Container,
  Title,
  Paper,
  Group,
  Button,
  Table,
  Badge,
  ActionIcon,
  Modal,
  Stack,
  TextInput,
  PasswordInput,
  Select,
  Text,
  Tooltip,
  Loader,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUserPlus,
  IconLock,
  IconLockOpen,
  IconKey,
  IconEdit,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { parseApiError } from '../utils/parseApiError';
import { formatDate } from '../utils/formatDate';
import { CuidadorSelect } from '../components/CuidadorPicker';

interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  rol: 'ADMIN' | 'EMPLEADO';
  activo: boolean;
  cuidadorId: string | null;
  cuidadorNombre: string | null;
  createdAt: string;
}

const ROLES = [
  { value: 'EMPLEADO', label: 'Empleado (sólo fichaje)' },
  { value: 'ADMIN', label: 'Administrador' },
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [crearAbierto, setCrearAbierto] = useState(false);
  const [editar, setEditar] = useState<Usuario | null>(null);
  const [password, setPassword] = useState<Usuario | null>(null);

  // Form de creación
  const [form, setForm] = useState({ email: '', nombre: '', password: '', rol: 'EMPLEADO', cuidadorId: '' });
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [formEdit, setFormEdit] = useState({ nombre: '', rol: 'EMPLEADO', cuidadorId: '' });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/usuarios');
      const data = await res.json();
      if (data.ok) setUsuarios(data.data);
    } catch (error) {
      notifications.show({ title: 'Error', message: parseApiError(error), color: 'red' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /** Un cuidador ya tomado por otro usuario no se ofrece: la relación es 1 a 1. */
  const cuidadorOcupado = (cuidadorId: string, usuarioActualId?: string) =>
    usuarios.some((u) => u.cuidadorId === cuidadorId && u.id !== usuarioActualId);

  const handleCrear = async () => {
    if (!form.email || !form.password) {
      notifications.show({ title: 'Error', message: 'Email y contraseña son obligatorios', color: 'red' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/v1/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          nombre: form.nombre.trim() || undefined,
          rol: form.rol,
          cuidadorId: form.rol === 'EMPLEADO' && form.cuidadorId ? form.cuidadorId : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error?.message || 'No se pudo crear el usuario');

      notifications.show({ title: 'Listo', message: 'Usuario creado', color: 'green' });
      setCrearAbierto(false);
      setForm({ email: '', nombre: '', password: '', rol: 'EMPLEADO', cuidadorId: '' });
      cargar();
    } catch (error) {
      notifications.show({ title: 'Error', message: parseApiError(error), color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const patch = async (usuario: Usuario, cambios: Record<string, unknown>, mensaje: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/usuarios/${usuario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error?.message || 'No se pudo actualizar');

      notifications.show({ title: 'Listo', message: mensaje, color: 'green' });
      setEditar(null);
      cargar();
    } catch (error) {
      notifications.show({ title: 'Error', message: parseApiError(error), color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async () => {
    if (!password) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/usuarios/${password.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: nuevaPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error?.message || 'No se pudo cambiar la contraseña');

      notifications.show({ title: 'Listo', message: 'Contraseña actualizada', color: 'green' });
      setPassword(null);
      setNuevaPassword('');
    } catch (error) {
      notifications.show({ title: 'Error', message: parseApiError(error), color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const empleadosSinCuidador = usuarios.filter((u) => u.rol === 'EMPLEADO' && !u.cuidadorId);

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Usuarios</Title>
        <Button leftSection={<IconUserPlus size={18} />} onClick={() => setCrearAbierto(true)}>
          Nuevo usuario
        </Button>
      </Group>

      {empleadosSinCuidador.length > 0 && (
        <Alert color="yellow" icon={<IconAlertTriangle size={18} />} mb="md">
          {empleadosSinCuidador.length === 1
            ? 'Hay un empleado sin cuidador vinculado: no va a poder fichar hasta que lo asignes.'
            : `Hay ${empleadosSinCuidador.length} empleados sin cuidador vinculado: no van a poder fichar hasta que los asignes.`}
        </Alert>
      )}

      <Paper withBorder p="md">
        {loading ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : (
          <Table.ScrollContainer minWidth={720}>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Rol</Table.Th>
                  <Table.Th>Cuidador vinculado</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Alta</Table.Th>
                  <Table.Th>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {usuarios.map((u) => (
                  <Table.Tr key={u.id}>
                    <Table.Td>{u.email}</Table.Td>
                    <Table.Td>{u.nombre || '-'}</Table.Td>
                    <Table.Td>
                      <Badge color={u.rol === 'ADMIN' ? 'grape' : 'cyan'} variant="light">
                        {u.rol === 'ADMIN' ? 'Administrador' : 'Empleado'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{u.cuidadorNombre || '-'}</Table.Td>
                    <Table.Td>
                      <Badge color={u.activo ? 'green' : 'red'} variant="light">
                        {u.activo ? 'Activo' : 'Bloqueado'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(u.createdAt)}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Editar">
                          <ActionIcon
                            variant="light"
                            onClick={() => {
                              setEditar(u);
                              setFormEdit({ nombre: u.nombre ?? '', rol: u.rol, cuidadorId: u.cuidadorId ?? '' });
                            }}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Cambiar contraseña">
                          <ActionIcon variant="light" color="yellow" onClick={() => setPassword(u)}>
                            <IconKey size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={u.activo ? 'Bloquear ingreso' : 'Desbloquear'}>
                          <ActionIcon
                            variant="light"
                            color={u.activo ? 'red' : 'green'}
                            onClick={() =>
                              patch(u, { activo: !u.activo }, u.activo ? 'Usuario bloqueado' : 'Usuario desbloqueado')
                            }
                          >
                            {u.activo ? <IconLock size={16} /> : <IconLockOpen size={16} />}
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {usuarios.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text c="dimmed" ta="center" py="md">
                        No hay usuarios cargados.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {/* Crear */}
      <Modal opened={crearAbierto} onClose={() => setCrearAbierto(false)} title="Nuevo usuario" centered>
        <Stack>
          <TextInput
            label="Email"
            required
            placeholder="empleado@carebydani.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
          />
          <TextInput
            label="Nombre"
            placeholder="Nombre y apellido"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.currentTarget.value })}
          />
          <PasswordInput
            label="Contraseña"
            required
            description="Mínimo 8 caracteres. Se la pasás vos al empleado."
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.currentTarget.value })}
          />
          <Select
            label="Rol"
            data={ROLES}
            value={form.rol}
            onChange={(v) => setForm({ ...form, rol: v || 'EMPLEADO' })}
            allowDeselect={false}
          />
          {form.rol === 'EMPLEADO' && (
            <CuidadorSelect
              label="Cuidador vinculado"
              description="Necesario para fichar entrada y salida."
              value={form.cuidadorId || null}
              onChange={(v) => setForm({ ...form, cuidadorId: v || '' })}
              excluir={cuidadorOcupado}
              clearable
            />
          )}
          <Button onClick={handleCrear} loading={saving}>
            Crear usuario
          </Button>
        </Stack>
      </Modal>

      {/* Editar */}
      <Modal opened={!!editar} onClose={() => setEditar(null)} title={`Editar ${editar?.email ?? ''}`} centered>
        <Stack>
          <TextInput
            label="Nombre"
            value={formEdit.nombre}
            onChange={(e) => setFormEdit({ ...formEdit, nombre: e.currentTarget.value })}
          />
          <Select
            label="Rol"
            data={ROLES}
            value={formEdit.rol}
            onChange={(v) => setFormEdit({ ...formEdit, rol: v || 'EMPLEADO' })}
            allowDeselect={false}
          />
          {formEdit.rol === 'EMPLEADO' && (
            <CuidadorSelect
              label="Cuidador vinculado"
              value={formEdit.cuidadorId || null}
              onChange={(v) => setFormEdit({ ...formEdit, cuidadorId: v || '' })}
              excluir={(id) => cuidadorOcupado(id, editar?.id)}
              iniciales={
                editar?.cuidadorId && editar.cuidadorNombre
                  ? [{ id: editar.cuidadorId, nombreCompleto: editar.cuidadorNombre }]
                  : []
              }
              clearable
            />
          )}
          <Button
            loading={saving}
            onClick={() =>
              editar &&
              patch(
                editar,
                {
                  nombre: formEdit.nombre.trim() || null,
                  rol: formEdit.rol,
                  cuidadorId: formEdit.rol === 'EMPLEADO' && formEdit.cuidadorId ? formEdit.cuidadorId : null,
                },
                'Usuario actualizado'
              )
            }
          >
            Guardar
          </Button>
        </Stack>
      </Modal>

      {/* Contraseña */}
      <Modal
        opened={!!password}
        onClose={() => {
          setPassword(null);
          setNuevaPassword('');
        }}
        title={`Nueva contraseña para ${password?.email ?? ''}`}
        centered
      >
        <Stack>
          <PasswordInput
            label="Contraseña"
            required
            description="Mínimo 8 caracteres."
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.currentTarget.value)}
          />
          <Button onClick={handlePassword} loading={saving} disabled={nuevaPassword.length < 8}>
            Cambiar contraseña
          </Button>
        </Stack>
      </Modal>
    </Container>
  );
}
