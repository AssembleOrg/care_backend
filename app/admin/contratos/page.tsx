'use client';

import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
    TextInput,
    Button,
    Group,
    Title,
    Paper,
    Switch,
    Select,
    Container,
    Text,
    Table,
    Badge,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { ContratoDTO } from '@/src/application/dto/ContratoDTO';

export default function ContratosPage() {
    const [isManual, setIsManual] = useState(false);
    const [createdContrato, setCreatedContrato] = useState<ContratoDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // State for personas and contracts
    const [personas, setPersonas] = useState<any[]>([]);
    const [contratos, setContratos] = useState<ContratoDTO[]>([]);

    const fetchContratos = async () => {
        try {
            const res = await fetch('/api/v1/contratos');
            if (res.ok) {
                const data = await res.json();
                setContratos(data);
            }
        } catch (error) {
            console.error("Error loading contratos", error);
        }
    };

    useEffect(() => {
        const fetchPersonas = async () => {
            try {
                const res = await fetch('/api/v1/personas-asistidas?all=true');
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data || []);
                    setPersonas(list.map((p: any) => ({
                        value: p.id,
                        label: p.nombreCompleto,
                        cuit: p.dni,
                        direccion: p.direccion
                    })));
                }
            } catch (error) {
                console.error("Error loading personas", error);
                notifications.show({ title: 'Error', message: 'No se pudieron cargar las personas', color: 'red' });
            }
        };
        fetchPersonas();
    }, []);

    useEffect(() => {
        fetchContratos();
    }, []);

    const form = useForm({
        initialValues: {
            idCliente: null as string | null,
            nombreManual: '',
            cuitManual: '',
            direccionManual: '',
            telefonoEmergencia: '',
            fechaInicio: new Date(),
            fechaFin: new Date(),
        },
        validate: (values) => {
            if (!isManual && !values.idCliente) {
                return { idCliente: 'Debe seleccionar una persona' };
            }
            if (isManual) {
                const errors: any = {};
                if (!values.nombreManual) errors.nombreManual = 'El nombre es requerido';
                if (!values.cuitManual) errors.cuitManual = 'El CUIT es requerido';
                if (!values.direccionManual) errors.direccionManual = 'La dirección es requerida';
                return errors;
            }
            return {};
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setIsLoading(true);
        setCreatedContrato(null); // Resetear previo

        try {
            const response = await fetch('/api/v1/contratos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al crear contrato');
            }

            const contrato: ContratoDTO = await response.json();
            setCreatedContrato(contrato);
            fetchContratos(); // Refrescar lista
            notifications.show({
                title: 'Éxito',
                message: 'Contrato creado correctamente.',
                color: 'green',
            });
        } catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.message,
                color: 'red',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container size="md" py="xl">
            <Paper shadow="xs" p="xl" withBorder>
                <Title order={2} mb="lg">Nuevo Contrato</Title>

                <Group justify="flex-end" mb="md">
                    <Switch
                        label="Ingreso Manual"
                        checked={isManual}
                        onChange={(event) => {
                            setIsManual(event.currentTarget.checked);
                            form.setFieldValue('idCliente', null);
                        }}
                    />
                </Group>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    {!isManual ? (
                        <Select
                            label="Seleccionar Persona Asistida"
                            placeholder="Buscar..."
                            data={personas}
                            searchable
                            nothingFoundMessage="No se encontraron personas"
                            {...form.getInputProps('idCliente')}
                            mb="md"
                        />
                    ) : (
                        <>
                            <TextInput
                                label="Nombre Completo"
                                placeholder="Juan Perez"
                                {...form.getInputProps('nombreManual')}
                                mb="sm"
                            />
                            <TextInput
                                label="CUIT / DNI"
                                placeholder="20-xxxxxxxx-x"
                                {...form.getInputProps('cuitManual')}
                                mb="sm"
                            />
                            <TextInput
                                label="Dirección"
                                placeholder="Calle 123"
                                {...form.getInputProps('direccionManual')}
                                mb="sm"
                            />
                            <TextInput
                                label="Teléfono Emergencia (Opcional)"
                                placeholder="123456789"
                                {...form.getInputProps('telefonoEmergencia')}
                                mb="md"
                            />
                        </>
                    )}

                    <Group grow mb="md">
                        <DateInput
                            label="Fecha Inicio"
                            {...form.getInputProps('fechaInicio')}
                        />
                        <DateInput
                            label="Fecha Fin"
                            {...form.getInputProps('fechaFin')}
                        />
                    </Group>

                    <Group justify="flex-end" mt="xl">
                        <Button type="submit" loading={isLoading}>
                            Generar Contrato
                        </Button>
                    </Group>
                </form>

                {createdContrato && (
                    <Paper withBorder p="md" mt="lg" bg="gray.0">
                        <Text fw={500} mb="sm">Contrato Generado con Éxito</Text>
                        <Button
                            color="green"
                            component="a"
                            href={`/api/v1/contratos/${createdContrato.id}/pdf`}
                            target="_blank"
                        >
                            Descargar PDF
                        </Button>
                    </Paper>
                )}
            </Paper>

            <Paper shadow="xs" p="xl" withBorder mt="xl">
                <Title order={3} mb="md">Últimos Contratos</Title>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Fecha</Table.Th>
                            <Table.Th>Cliente</Table.Th>
                            <Table.Th>Dirección</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {contratos.map((contrato) => {
                            const persona = personas.find((p: any) => p.value === contrato.idCliente);
                            const nombre = contrato.nombreManual || persona?.label || 'Desconocido';
                            const direccion = contrato.direccionManual || persona?.direccion || '-';

                            return (
                                <Table.Tr key={contrato.id}>
                                    <Table.Td>{new Date(contrato.createdAt).toLocaleDateString()}</Table.Td>
                                    <Table.Td>{nombre}</Table.Td>
                                    <Table.Td>{direccion}</Table.Td>
                                    <Table.Td>
                                        <Button
                                            component="a"
                                            href={`/api/v1/contratos/${contrato.id}/pdf`}
                                            target="_blank"
                                            size="xs"
                                            variant="light"
                                        >
                                            Descargar
                                        </Button>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                        {contratos.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={4}>No hay contratos recientes</Table.Td>
                            </Table.Tr>
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>

        </Container>
    );
}