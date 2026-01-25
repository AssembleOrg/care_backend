'use client';

import { Container, Title, Text, Grid, Card, Button, Stack, Group, Badge, Paper, Box, Anchor, SimpleGrid, Divider } from '@mantine/core';
import { IconCheck, IconArrowRight, IconHeart, IconShieldCheck, IconCalendar, IconMedicalCross, IconHome, IconUserCircle, IconUsers, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';


export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Navbar */}
      <header className={styles.navbar}>
        <Container size="xl" className={styles.navbarContainer}>
          <Group justify="space-between" h={80} wrap="nowrap" gap="xs" className={styles.navbarGroup}>
            <Group gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0, flexShrink: 1 }}>
              <Image 
                src="/image.png" 
                alt="Care By Dani Logo" 
                width={108} 
                height={108}
                className={styles.navbarLogo}
                style={{ objectFit: 'contain' }}
              />
              <Text 
                fw={600} 
                size="xl" 
                className={styles.logo} 
                visibleFrom="sm" 
                style={{ whiteSpace: 'nowrap' }}
              >
                Care By Dani
              </Text>
            </Group>
            <Group gap="lg" visibleFrom="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
              <Anchor href="#inicio" c="inherit" underline="never" style={{ whiteSpace: 'nowrap' }}>Inicio</Anchor>
              <Anchor href="#servicios" c="inherit" underline="never" style={{ whiteSpace: 'nowrap' }}>Servicios</Anchor>
              <Anchor href="#nosotros" c="inherit" underline="never" style={{ whiteSpace: 'nowrap' }}>Nosotros</Anchor>
              <Anchor href="#contacto" c="inherit" underline="never" style={{ whiteSpace: 'nowrap' }}>Contacto</Anchor>
              <Link href="/admin/login">
                <Button variant="outline" color="primary" size="sm" radius="xl">
                  Iniciar sesión
                </Button>
              </Link>
            </Group>
            <Group hiddenFrom="sm" style={{ flexShrink: 0, display: 'flex' }} className={styles.mobileLoginGroup}>
              <Link href="/admin/login" style={{ display: 'flex', textDecoration: 'none' }}>
                <Button variant="outline" color="primary" size="sm" radius="xl" className={styles.mobileLoginButton}>
                  Login
                </Button>
              </Link>
            </Group>
          </Group>
        </Container>
      </header>

      {/* Hero Section */}
      <section id="inicio" className={styles.hero}>
        <Container size="xl" className={styles.heroContainer}>
          <Grid gutter={60} align="center">
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Stack gap="xl" ta={{ base: 'center', lg: 'left' }}>
                <Badge size="lg" variant="light" color="primary" radius="xl" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cuidado Profesional & Empático
                </Badge>
                <Title order={1} className={styles.heroTitle}>
                  Cuidado con <span className={styles.heroAccent}>corazón</span> en la comodidad de su hogar
                </Title>
                <Text size="lg" className={styles.heroSubtitle}>
                  Brindamos asistencia personalizada y compañía a adultos mayores, asegurando su bienestar y tranquilidad con un equipo profesional y humano.
                </Text>
                <Group gap="md" justify="flex-start" wrap="wrap" className={styles.heroButtons}>
                  <Link href="#contacto">
                    <Button size="lg" color="primary" radius="xl" rightSection={<IconArrowRight size={20} />} className={styles.heroButton}>
                      Solicitar información
                    </Button>
                  </Link>
                  <Link href="#servicios">
                    <Button size="lg" variant="outline" color="primary" radius="xl" className={styles.heroButton}>
                      Conocer servicios
                    </Button>
                  </Link>
                </Group>
                <Group gap="md" justify="flex-start" mt="xl">
                  <Group gap="xs">
                    <Group gap={-8}>
                      <Box w={32} h={32} style={{ borderRadius: '50%', border: '2px solid white', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconUser size={18} color="#2C8894" />
                      </Box>
                      <Box w={32} h={32} style={{ borderRadius: '50%', border: '2px solid white', background: '#d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconUser size={18} color="#2C8894" />
                      </Box>
                      <Box w={32} h={32} style={{ borderRadius: '50%', border: '2px solid white', background: '#c0c0c0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconUser size={18} color="#2C8894" />
                      </Box>
                    </Group>
                    <Text size="sm" c="dimmed">
                      Más de <Text component="span" fw={700} c="primary">500 familias</Text> confían en nosotros
                    </Text>
                  </Group>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Box className={styles.heroImageWrapper}>
                <Image 
                  src="/cuidadora1.png" 
                  alt="Cuidadora ayudando a una persona mayor" 
                  width={600}
                  height={500}
                  style={{ 
                    objectFit: 'cover',
                    borderRadius: '1rem',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                  }}
                  priority
                />
                <Paper className={styles.heroRatingCard} p="md" radius="xl" withBorder>
                  <Group gap="sm">
                    <IconCheck size={32} color="#D4AF37" />
                    <div>
                      <Text fw={700} size="lg">4.9/5</Text>
                      <Text size="xs" c="dimmed">Valoración de clientes</Text>
                    </div>
                  </Group>
                </Paper>
              </Box>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* Por qué elegirnos */}
      <section id="nosotros" className={styles.whySection}>
        <Container size="xl" className={styles.sectionContainer}>
          <Stack gap={60}>
            <div style={{ textAlign: 'center' }}>
              <Title order={2} className={styles.sectionTitle} mb="md">
                ¿Por qué elegirnos?
              </Title>
              <Text size="lg" c="dimmed" maw={600} mx="auto">
                Entendemos que el cuidado de sus seres queridos es una prioridad. Nuestro enfoque se basa en la confianza, la empatía y la excelencia.
              </Text>
            </div>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
              <Card className={styles.featureCard} p="xl" radius="xl" withBorder>
                <Box className={styles.featureIcon} mb="lg">
                  <IconHeart size={48} />
                </Box>
                <Title order={3} mb="md">Cuidado Compasivo</Title>
                <Text c="dimmed" lh={1.7}>
                  Tratamos a cada persona como si fuera de nuestra propia familia, priorizando su dignidad y respeto en todo momento.
                </Text>
              </Card>
              <Card className={styles.featureCard} p="xl" radius="xl" withBorder>
                <Box className={styles.featureIcon} mb="lg">
                  <IconShieldCheck size={48} />
                </Box>
                <Title order={3} mb="md">Personal Verificado</Title>
                <Text c="dimmed" lh={1.7}>
                  Todos nuestros cuidadores pasan por rigurosos procesos de selección y antecedentes para garantizar su seguridad.
                </Text>
              </Card>
              <Card className={styles.featureCard} p="xl" radius="xl" withBorder>
                <Box className={styles.featureIcon} mb="lg">
                  <IconCalendar size={48} />
                </Box>
                <Title order={3} mb="md">Flexibilidad Total</Title>
                <Text c="dimmed" lh={1.7}>
                  Adaptamos nuestros horarios y servicios a sus necesidades específicas, desde unas horas hasta cuidado 24/7.
                </Text>
              </Card>
            </SimpleGrid>
          </Stack>
        </Container>
      </section>

      {/* Servicios */}
      <section id="servicios" className={styles.servicesSection}>
        <Container size="xl" className={styles.sectionContainer}>
          <Grid gutter={60} align="center">
            <Grid.Col span={{ base: 12, lg: 6 }} order={{ base: 2, lg: 1 }}>
              <Box className={styles.serviceImageWrapper}>
                <Image 
                  src="/cuidadora2.png" 
                  alt="Cuidadora ayudando a una señora a caminar en el parque" 
                  width={600}
                  height={500}
                  style={{ 
                    objectFit: 'cover',
                    borderRadius: '1rem',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                  }}
                />
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6 }} order={{ base: 1, lg: 2 }}>
              <Stack gap="xl">
                <Badge color="primary" variant="light" size="lg" radius="xl" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Nuestros Servicios
                </Badge>
                <Title order={2} className={styles.sectionTitle}>
                  Asistencia integral para una vida plena
                </Title>
                <Stack gap="lg">
                  <Group gap="md" align="flex-start">
                    <Box className={styles.serviceIcon}>
                      <IconMedicalCross size={32} />
                    </Box>
                    <div>
                      <Title order={4} mb={4}>Acompañamiento Médico</Title>
                      <Text c="dimmed" size="sm">Supervisión de medicación y acompañamiento a citas médicas.</Text>
                    </div>
                  </Group>
                  <Group gap="md" align="flex-start">
                    <Box className={styles.serviceIcon}>
                      <IconHome size={32} />
                    </Box>
                    <div>
                      <Title order={4} mb={4}>Ayuda en el Hogar</Title>
                      <Text c="dimmed" size="sm">Apoyo con tareas domésticas ligeras, preparación de comidas y organización.</Text>
                    </div>
                  </Group>
                  <Group gap="md" align="flex-start">
                    <Box className={styles.serviceIcon}>
                      <IconUserCircle size={32} />
                    </Box>
                    <div>
                      <Title order={4} mb={4}>Higiene Personal</Title>
                      <Text c="dimmed" size="sm">Asistencia digna y respetuosa con el aseo personal y la vestimenta.</Text>
                    </div>
                  </Group>
                  <Group gap="md" align="flex-start">
                    <Box className={styles.serviceIcon}>
                      <IconUsers size={32} />
                    </Box>
                    <div>
                      <Title order={4} mb={4}>Compañía y Recreación</Title>
                      <Text c="dimmed" size="sm">Conversación, paseos, juegos y actividades para mantener la mente activa.</Text>
                    </div>
                  </Group>
                </Stack>
                <Anchor href="#contacto" c="primary" fw={500} size="lg">
                  Ver todos los detalles <IconArrowRight size={18} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
                </Anchor>
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* Testimonios */}
      <section className={styles.testimonialSection}>
        <Container size="md" className={styles.sectionContainer}>
          <Stack gap="lg" align="center" ta="center" maw={800} mx="auto">
            <Text size="xl" c="white" opacity={0.3} style={{ fontFamily: 'serif', lineHeight: 1, fontSize: '40px' }}>❝</Text>
            <Text size="md" c="white" fw={500} fz={{ base: 'md', md: 'lg' }} lh={1.6} style={{ fontStyle: 'italic' }} maw={700}>
              "Dani y su equipo no solo cuidaron a mi padre, sino que le devolvieron la alegría. Sentimos una paz inmensa sabiendo que estaba en las mejores manos."
            </Text>
            <Group gap="md" mt="md">
              <Box w={56} h={56} style={{ borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', background: '#e0e0e0' }} />
              <Stack gap={2}>
                <Text fw={600} c="white" size="md">María González</Text>
                <Text c="white" opacity={0.7} size="xs">Hija de paciente</Text>
              </Stack>
            </Group>
          </Stack>
        </Container>
      </section>

      {/* Contacto */}
      <section id="contacto" className={styles.contactSection}>
        <Container size="xl" className={styles.sectionContainer}>
          <Paper className={styles.contactCard} p="xl" radius="2xl">
            <Grid gutter={60} align="center">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Box style={{ width: '100%', overflow: 'hidden' }}>
                  <Image 
                    src="/cuidadora3.png" 
                    alt="Cuidadora ayudando a una persona mayor" 
                    width={600}
                    height={400}
                    style={{ 
                      objectFit: 'cover',
                      borderRadius: '1rem',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                      width: '100%',
                      height: 'auto',
                      maxWidth: '100%',
                    }}
                  />
                </Box>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xl">
                  <Title order={2} className={styles.sectionTitle}>
                    ¿Listo para mejorar la calidad de vida de su ser querido?
                  </Title>
                  <Text size="lg" c="dimmed">
                    Contáctenos hoy para una consulta gratuita. Evaluaremos sus necesidades y diseñaremos un plan de cuidado personalizado.
                  </Text>
                  <Stack gap="md">
                    <Group grow>
                      <input 
                        type="text" 
                        placeholder="Nombre completo" 
                        className={styles.contactInput}
                      />
                      <input 
                        type="tel" 
                        placeholder="Teléfono" 
                        className={styles.contactInput}
                      />
                    </Group>
                    <input 
                      type="email" 
                      placeholder="Correo electrónico" 
                      className={styles.contactInput}
                    />
                    <textarea 
                      placeholder="¿Cómo podemos ayudarle?" 
                      rows={3}
                      className={styles.contactInput}
                    />
                    <Button size="lg" color="secondary" radius="md" rightSection={<IconArrowRight size={18} />}>
                      Enviar mensaje
                    </Button>
                  </Stack>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        </Container>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <Container size="xl" className={styles.footerContainer}>
          <Grid gutter="xl" mb="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Box mb="md" style={{ width: '100%', overflow: 'hidden' }}>
                <Image 
                  src="/image.png" 
                  alt="Care By Dani Logo" 
                  width={300} 
                  height={300}
                  style={{ 
                    objectFit: 'contain',
                    width: 'clamp(120px, 30vw, 300px)',
                    height: 'auto',
                    maxWidth: '100%',
                  }}
                />
              </Box>
              <Text size="sm" c="dimmed" mb="md">
                Dedicados a brindar cuidado humano, cálido y profesional. Su bienestar es nuestra misión.
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Text fw={600} size="sm" mb="md" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                Enlaces Rápidos
              </Text>
              <Stack gap="xs">
                <Anchor href="#inicio" c="dimmed" size="sm" underline="never">Inicio</Anchor>
                <Anchor href="#servicios" c="dimmed" size="sm" underline="never">Nuestros Servicios</Anchor>
                <Anchor href="#nosotros" c="dimmed" size="sm" underline="never">Sobre Nosotros</Anchor>
                <Anchor href="#contacto" c="dimmed" size="sm" underline="never">Contáctenos</Anchor>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Text fw={600} size="sm" mb="md" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                Contacto
              </Text>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">Calle Principal 123, Ciudad, País</Text>
                <Text size="sm" c="dimmed">+1 234 567 890</Text>
                <Text size="sm" c="dimmed">contacto@carebydani.com</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Text fw={600} size="sm" mb="md" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                Horario de Atención
              </Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Lunes - Viernes:</Text>
                  <Text size="sm" c="dimmed">9:00 - 18:00</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Sábado:</Text>
                  <Text size="sm" c="dimmed">10:00 - 14:00</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Domingo:</Text>
                  <Text size="sm" c="dimmed">Cerrado</Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
          <Divider my="xl" />
          <Group justify="space-between" wrap="wrap">
            <Text size="sm" c="dimmed">
              © {new Date().getFullYear()} Care By Dani. Todos los derechos reservados.
            </Text>
            <Group gap="lg">
              <Anchor href="#" c="dimmed" size="sm" underline="never">Privacidad</Anchor>
              <Anchor href="#" c="dimmed" size="sm" underline="never">Términos</Anchor>
            </Group>
          </Group>
        </Container>
      </footer>
    </div>
  );
}
