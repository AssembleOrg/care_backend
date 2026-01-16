'use client';

import { Container, Title, Text, Grid, Card, Button, Stack, Group, Badge, Table, Paper, Box, Anchor, SimpleGrid, Divider, Accordion } from '@mantine/core';
import { IconReceipt, IconShield, IconHistory, IconChartBar, IconFileText, IconCheck, IconArrowRight, IconLock, IconClock, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import styles from './page.module.css';

const mockPagos = [
  { id: '1', cuidador: 'María González', monto: 85000, fecha: '15 Ene 2024', metodo: 'Transferencia' },
  { id: '2', cuidador: 'Juan Pérez', monto: 72000, fecha: '20 Ene 2024', metodo: 'Efectivo' },
  { id: '3', cuidador: 'Ana Martínez', monto: 91000, fecha: '25 Ene 2024', metodo: 'Transferencia' },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Navbar */}
      <header className={styles.navbar}>
        <Container size="xl">
          <Group justify="space-between" h={70} wrap="nowrap">
            <Text fw={700} size="xl" className={styles.logo} style={{ whiteSpace: 'nowrap' }}>
              CareByDani
            </Text>
            <Group gap="lg" visibleFrom="sm" wrap="nowrap">
              <Anchor href="#funciones" c="inherit" underline="never" style={{ whiteSpace: 'nowrap' }}>Funciones</Anchor>
              <Anchor href="#seguridad" c="inherit" underline="never" style={{ whiteSpace: 'nowrap' }}>Seguridad</Anchor>
              <Anchor href="#faq" c="inherit" underline="never" style={{ whiteSpace: 'nowrap' }}>FAQ</Anchor>
              <Link href="/admin/login">
                <Button variant="filled" className={styles.ctaButton} size="sm">
                  Acceder al Panel
                </Button>
              </Link>
            </Group>
            <Group hiddenFrom="sm">
              <Link href="/admin/login">
                <Button variant="filled" className={styles.ctaButton} size="xs">
                  Panel
                </Button>
              </Link>
            </Group>
          </Group>
        </Container>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <Container size="xl" py={120}>
          <Grid gutter={60} align="center">
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap="xl">
                <Badge size="lg" variant="light" className={styles.heroBadge}>
                  Sistema de gestión para cuidadores
                </Badge>
                <Title order={1} className={styles.heroTitle}>
                  Pagos claros.<br />
                  <span className={styles.heroAccent}>Historial completo.</span>
                </Title>
                <Text size="xl" className={styles.heroSubtitle}>
                  Gestioná los pagos a cuidadores con un sistema simple, seguro y auditable. 
                  Recibos en un clic, cuando los necesitás.
                </Text>
                <Group gap="md" wrap="wrap">
                  <Link href="/admin/login">
                    <Button size="xl" className={styles.ctaButton} rightSection={<IconArrowRight size={20} />} fullWidth>
                      Comenzar ahora
                    </Button>
                  </Link>
                  <Button size="xl" variant="outline" className={styles.secondaryButton} fullWidth>
                    Ver demo
                  </Button>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }}>
              {/* Placeholder para imagen/ilustración */}
              <div className={styles.heroImagePlaceholder}>
                <Text c="dimmed" ta="center">Ilustración del dashboard</Text>
              </div>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* Bento Grid - Funciones */}
      <section id="funciones" className={styles.bentoSection}>
        <Container size="xl" py={100}>
          <Stack gap={60}>
            <div>
              <Text className={styles.sectionLabel}>FUNCIONES</Text>
              <Title order={2} className={styles.sectionTitle}>
                Todo lo que necesitás,<br />nada que no.
              </Title>
            </div>

            <div className={styles.bentoGrid}>
              {/* Card grande - Saldo por cuidador */}
              <Card className={`${styles.bentoCard} ${styles.bentoLarge}`}>
                <Stack gap="md" h="100%" justify="space-between">
                  <div>
                    <Badge className={styles.cardBadge} mb="md">Principal</Badge>
                    <Title order={3} className={styles.cardTitle}>Saldo por cuidador</Title>
                    <Text c="dimmed" mt="sm">
                      Visualizá el total pagado a cada cuidador, filtrado por período. 
                      Agrupaciones mensuales automáticas.
                    </Text>
                  </div>
                  <div className={styles.cardStats}>
                    <div>
                      <Text size="sm" c="dimmed">Este mes</Text>
                      <Text fw={700} size="xl" className={styles.statNumber}>$248.000</Text>
                    </div>
                    <Divider orientation="vertical" />
                    <div>
                      <Text size="sm" c="dimmed">Pagos</Text>
                      <Text fw={700} size="xl">12</Text>
                    </div>
                    <Divider orientation="vertical" />
                    <div>
                      <Text size="sm" c="dimmed">Cuidadores</Text>
                      <Text fw={700} size="xl">3</Text>
                    </div>
                  </div>
                </Stack>
              </Card>

              {/* Card mediana - Recibos */}
              <Card className={`${styles.bentoCard} ${styles.bentoMedium}`}>
                <IconReceipt size={32} className={styles.cardIcon} />
                <Title order={4} mt="md">Recibos on-demand</Title>
                <Text size="sm" c="dimmed" mt="xs">
                  Generá PDFs cuando los necesites. No se guardan, se crean al instante.
                </Text>
              </Card>

              {/* Card pequeña - Historial */}
              <Card className={`${styles.bentoCard} ${styles.bentoSmall}`}>
                <IconHistory size={28} className={styles.cardIcon} />
                <Title order={5} mt="sm">Historial auditable</Title>
                <Text size="xs" c="dimmed" mt={4}>
                  Cada operación registrada
                </Text>
              </Card>

              {/* Card pequeña - Filtros */}
              <Card className={`${styles.bentoCard} ${styles.bentoSmall}`}>
                <IconChartBar size={28} className={styles.cardIcon} />
                <Title order={5} mt="sm">Filtros avanzados</Title>
                <Text size="xs" c="dimmed" mt={4}>
                  Por cuidador, fechas, método
                </Text>
              </Card>

              {/* Card mediana - Seguridad */}
              <Card className={`${styles.bentoCard} ${styles.bentoMedium} ${styles.bentoAccent}`}>
                <IconShield size={32} style={{ color: '#FFD93D' }} />
                <Title order={4} mt="md" c="white">Datos protegidos</Title>
                <Text size="sm" c="white" opacity={0.8} mt="xs">
                  Cifrado AES-256-GCM para toda información personal.
                </Text>
              </Card>

              {/* Card mediana horizontal - Asignaciones */}
              <Card className={`${styles.bentoCard} ${styles.bentoWide}`}>
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Title order={4}>Asignaciones flexibles</Title>
                    <Text size="sm" c="dimmed" mt="xs">
                      Vinculá cuidadores con personas asistidas. Definí tarifas, fechas y notas.
                    </Text>
                  </div>
                  <Badge size="lg" variant="light">Nuevo</Badge>
                </Group>
              </Card>
            </div>
          </Stack>
        </Container>
      </section>

      {/* Preview UI Section */}
      <section className={styles.previewSection}>
        <Container size="xl" py={100}>
          <Grid gutter={60}>
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap="xl">
                <div>
                  <Text className={styles.sectionLabel}>VISTA PREVIA</Text>
                  <Title order={2} className={styles.sectionTitle}>
                    Interfaz clara y directa
                  </Title>
                </div>
                <Text size="lg" c="dimmed">
                  Sin complicaciones. Registrá pagos, generá recibos y consultá saldos 
                  en segundos. Todo desde un panel intuitivo.
                </Text>
                <Stack gap="sm">
                  <Group gap="sm">
                    <IconCheck size={20} className={styles.checkIcon} />
                    <Text>Tabla de pagos con búsqueda</Text>
                  </Group>
                  <Group gap="sm">
                    <IconCheck size={20} className={styles.checkIcon} />
                    <Text>Filtros por cuidador y fechas</Text>
                  </Group>
                  <Group gap="sm">
                    <IconCheck size={20} className={styles.checkIcon} />
                    <Text>Generación de PDF con un clic</Text>
                  </Group>
                </Stack>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Paper className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <Group justify="space-between">
                    <Text fw={600}>Últimos pagos</Text>
                    <Badge>3 registros</Badge>
                  </Group>
                </div>
                <Table className={styles.previewTable}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Cuidador</Table.Th>
                      <Table.Th>Monto</Table.Th>
                      <Table.Th>Fecha</Table.Th>
                      <Table.Th>Acción</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {mockPagos.map((pago) => (
                      <Table.Tr key={pago.id}>
                        <Table.Td>{pago.cuidador}</Table.Td>
                        <Table.Td fw={600}>${pago.monto.toLocaleString()}</Table.Td>
                        <Table.Td c="dimmed">{pago.fecha}</Table.Td>
                        <Table.Td>
                          <Button size="xs" variant="light" leftSection={<IconFileText size={14} />}>
                            PDF
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                <Divider my="md" />
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Total del período</Text>
                  <Text fw={700} size="lg" className={styles.totalAmount}>$248.000</Text>
                </Group>
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* Timeline / Cómo funciona */}
      <section className={styles.timelineSection}>
        <Container size="xl" py={100}>
          <Stack gap={60}>
            <div style={{ textAlign: 'center' }}>
              <Text className={styles.sectionLabel}>CÓMO FUNCIONA</Text>
              <Title order={2} className={styles.sectionTitle}>
                Tres pasos. Sin vueltas.
              </Title>
            </div>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing={40}>
              <Card className={styles.timelineCard}>
                <div className={styles.stepNumber}>1</div>
                <IconUser size={32} className={styles.stepIcon} />
                <Title order={4} mt="md">Registrá cuidadores</Title>
                <Text size="sm" c="dimmed" mt="xs">
                  Cargá nombre, DNI, teléfono y email. Los datos personales se cifran automáticamente.
                </Text>
                <Text size="xs" c="dimmed" mt="md" fs="italic">
                  Ej: María González, DNI cifrado con hash único para búsquedas.
                </Text>
              </Card>

              <Card className={styles.timelineCard}>
                <div className={styles.stepNumber}>2</div>
                <IconReceipt size={32} className={styles.stepIcon} />
                <Title order={4} mt="md">Registrá pagos</Title>
                <Text size="sm" c="dimmed" mt="xs">
                  Monto, fecha, método y notas. Podés filtrar por cuidador y rango de fechas.
                </Text>
                <Text size="xs" c="dimmed" mt="md" fs="italic">
                  Ej: $85.000 a María González el 15/01 por transferencia.
                </Text>
              </Card>

              <Card className={styles.timelineCard}>
                <div className={styles.stepNumber}>3</div>
                <IconFileText size={32} className={styles.stepIcon} />
                <Title order={4} mt="md">Generá recibos</Title>
                <Text size="sm" c="dimmed" mt="xs">
                  PDFs bajo demanda. No se guardan, se crean al instante con todos los datos.
                </Text>
                <Text size="xs" c="dimmed" mt="md" fs="italic">
                  Ej: Click en "Generar PDF" y descargás el recibo en segundos.
                </Text>
              </Card>
            </SimpleGrid>
          </Stack>
        </Container>
      </section>

      {/* Seguridad Section */}
      <section id="seguridad" className={styles.securitySection}>
        <Container size="xl" py={100}>
          <Grid gutter={60} align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
              {/* Placeholder para ilustración de seguridad */}
              <div className={styles.securityImagePlaceholder}>
                <IconLock size={80} style={{ opacity: 0.3 }} />
                <Text c="dimmed" mt="md">Ilustración de seguridad</Text>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xl">
                <div>
                  <Text className={styles.sectionLabel}>SEGURIDAD</Text>
                  <Title order={2} className={styles.sectionTitle}>
                    Tus datos, protegidos
                  </Title>
                </div>
                <Text size="lg" c="dimmed">
                  La privacidad no es negociable. Toda información personal está cifrada 
                  con estándares de nivel bancario.
                </Text>
                <Stack gap="md">
                  <Group gap="md" className={styles.securityItem}>
                    <div className={styles.securityIcon}>
                      <IconShield size={24} />
                    </div>
                    <div>
                      <Text fw={600}>Cifrado AES-256-GCM</Text>
                      <Text size="sm" c="dimmed">DNI, teléfono, email y dirección siempre cifrados</Text>
                    </div>
                  </Group>
                  <Group gap="md" className={styles.securityItem}>
                    <div className={styles.securityIcon}>
                      <IconHistory size={24} />
                    </div>
                    <div>
                      <Text fw={600}>Auditoría completa</Text>
                      <Text size="sm" c="dimmed">Cada operación queda registrada sin datos personales</Text>
                    </div>
                  </Group>
                  <Group gap="md" className={styles.securityItem}>
                    <div className={styles.securityIcon}>
                      <IconLock size={24} />
                    </div>
                    <div>
                      <Text fw={600}>Autenticación segura</Text>
                      <Text size="sm" c="dimmed">Supabase Auth con sesiones protegidas</Text>
                    </div>
                  </Group>
                </Stack>
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.faqSection}>
        <Container size="md" py={100}>
          <Stack gap={60}>
            <div style={{ textAlign: 'center' }}>
              <Text className={styles.sectionLabel}>FAQ</Text>
              <Title order={2} className={styles.sectionTitle}>
                Preguntas frecuentes
              </Title>
            </div>

            <Accordion variant="separated" radius="md" className={styles.accordion}>
              <Accordion.Item value="pdf">
                <Accordion.Control>¿Se guarda el PDF en algún lado?</Accordion.Control>
                <Accordion.Panel>
                  No, los PDFs se generan bajo demanda. Cada vez que necesitás un recibo, 
                  se crea al instante con los datos actuales. No ocupan espacio ni quedan almacenados.
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="saldo">
                <Accordion.Control>¿Cómo se calcula el saldo?</Accordion.Control>
                <Accordion.Panel>
                  El saldo se calcula sumando todos los pagos registrados para un cuidador 
                  en el período seleccionado. Podés ver totales mensuales y agrupaciones automáticas.
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="datos">
                <Accordion.Control>¿Qué datos se protegen?</Accordion.Control>
                <Accordion.Panel>
                  DNI, teléfono, email y dirección se cifran con AES-256-GCM. 
                  Nunca aparecen en logs ni en respuestas de la API sin descifrar. 
                  Solo vos podés ver la información real.
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="filtros">
                <Accordion.Control>¿Puedo filtrar por fechas?</Accordion.Control>
                <Accordion.Panel>
                  Sí, en la vista de pagos y reportes podés filtrar por rango de fechas, 
                  cuidador específico y método de pago. Los filtros se combinan para búsquedas precisas.
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="pagos">
                <Accordion.Control>¿Integran pasarelas de pago?</Accordion.Control>
                <Accordion.Panel>
                  No, CareByDani es un sistema de registro interno. No procesamos pagos, 
                  solo los registrás para llevar el control. Sin comisiones ni integraciones externas.
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        </Container>
      </section>

      {/* CTA Final */}
      <section className={styles.ctaSection}>
        <Container size="md" py={100}>
          <Paper className={styles.ctaCard}>
            <Stack gap="xl" align="center" ta="center">
              <Title order={2} c="white">
                Empezá a ordenar tus pagos hoy
              </Title>
              <Text size="lg" c="white" opacity={0.9} maw={500}>
                Sin complicaciones, sin pasarelas de pago, sin suscripciones. 
                Solo un sistema simple para llevar el control.
              </Text>
              <Link href="/admin/login">
                <Button size="xl" variant="white" color="dark" rightSection={<IconArrowRight size={20} />}>
                  Acceder al panel
                </Button>
              </Link>
            </Stack>
          </Paper>
        </Container>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <Container size="xl" py={40}>
          <Group justify="space-between">
            <Text fw={600}>CareByDani</Text>
            <Text size="sm" c="dimmed">
              Tus datos, protegidos. © {new Date().getFullYear()}
            </Text>
          </Group>
        </Container>
      </footer>
    </div>
  );
}
