"use client";

import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Button,
  Stack,
  Group,
  Badge,
  Paper,
  Box,
  Anchor,
  ActionIcon,
  SimpleGrid,
  Divider,
  FileInput,
  Accordion,
  Burger,
  Drawer,
} from "@mantine/core";
import {
  IconArrowRight,
  IconHeart,
  IconShieldCheck,
  IconCalendar,
  IconMedicalCross,
  IconHome,
  IconUserCircle,
  IconUsers,
  IconBriefcase,
  IconPaperclip,
  IconLock,
  IconPhone,
  IconLogin,
} from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

export default function HomePage() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const [workForm, setWorkForm] = useState({
    nombre: "",
    apellido: "",
    zonaTrabajo: "",
    telefono: "",
    email: "",
    experiencia: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submittingWork, setSubmittingWork] = useState(false);

  const MAX_CV_BYTES = 10 * 1024 * 1024;
  const ALLOWED_CV_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const [contactForm, setContactForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    mensaje: "",
  });
  const [submittingContact, setSubmittingContact] = useState(false);
  // Honeypot anti-spam: debe quedar SIEMPRE vacío para un humano.
  const [honeypot, setHoneypot] = useState("");

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingContact(true);
    try {
      const response = await fetch("/api/v1/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...contactForm, website: honeypot }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Error al enviar el mensaje");

      notifications.show({
        title: "Éxito",
        message: "¡Mensaje enviado! Nos pondremos en contacto contigo pronto.",
        color: "green",
      });
      setContactForm({ nombre: "", telefono: "", email: "", mensaje: "" });
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleCvChange = (file: File | null) => {
    if (file) {
      if (file.size > MAX_CV_BYTES) {
        notifications.show({
          title: "Error",
          message: "El CV no puede superar los 10MB.",
          color: "red",
        });
        return;
      }
      if (file.type && !ALLOWED_CV_TYPES.includes(file.type)) {
        notifications.show({
          title: "Error",
          message: "Formato inválido. Se aceptan PDF, DOC o DOCX.",
          color: "red",
        });
        return;
      }
    }
    setCvFile(file);
  };

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingWork(true);
    try {
      const formData = new FormData();
      Object.entries(workForm).forEach(([key, value]) =>
        formData.append(key, value),
      );
      formData.append("website", honeypot);
      if (cvFile) formData.append("cv", cvFile);

      const response = await fetch("/api/v1/solicitudes-empleo", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Error al enviar la solicitud");

      notifications.show({
        title: "Éxito",
        message:
          "¡Solicitud enviada! Nos pondremos en contacto contigo pronto.",
        color: "green",
      });
      setWorkForm({
        nombre: "",
        apellido: "",
        zonaTrabajo: "",
        telefono: "",
        email: "",
        experiencia: "",
      });
      setCvFile(null);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    } finally {
      setSubmittingWork(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <header className={styles.navbar}>
        <Container size="xl" className={styles.navbarContainer}>
          <Group
            justify="space-between"
            h={80}
            wrap="nowrap"
            gap="xs"
            className={styles.navbarGroup}
          >
            <Group
              gap="md"
              wrap="nowrap"
              style={{ flex: 1, minWidth: 0, flexShrink: 1 }}
            >
              <Image
                src="/image.png"
                alt="Care By Dani Logo"
                width={108}
                height={108}
                className={styles.navbarLogo}
                style={{ objectFit: "contain" }}
              />
              <Text
                fw={600}
                size="xl"
                className={styles.logo}
                visibleFrom="sm"
                style={{ whiteSpace: "nowrap" }}
              >
                Care By Dani
              </Text>
            </Group>
            <Group
              gap="lg"
              visibleFrom="sm"
              wrap="nowrap"
              style={{ flexShrink: 0 }}
            >
              <Anchor
                href="#inicio"
                c="dark"
                underline="never"
                style={{ whiteSpace: "nowrap", color: "#1a1a2e" }}
              >
                Inicio
              </Anchor>
              <Anchor
                href="#servicios"
                c="dark"
                underline="never"
                style={{ whiteSpace: "nowrap", color: "#1a1a2e" }}
              >
                Servicios
              </Anchor>
              <Anchor
                href="#nosotros"
                c="dark"
                underline="never"
                style={{ whiteSpace: "nowrap", color: "#1a1a2e" }}
              >
                Nosotros
              </Anchor>
              <Anchor
                href="#trabaja-con-nosotros"
                c="dark"
                underline="never"
                style={{ whiteSpace: "nowrap", color: "#1a1a2e" }}
              >
                Trabaja con nosotros
              </Anchor>
              <Link href="#contacto">
                <Button size="sm" radius="xl" className={styles.ctaGold}>
                  Evaluación Gratuita
                </Button>
              </Link>
              <Link href="/admin/login" aria-label="Iniciar sesión (admin)">
                <ActionIcon
                  variant="subtle"
                  color="primary"
                  size="lg"
                  radius="xl"
                  title="Iniciar sesión"
                >
                  <IconLogin size={20} />
                </ActionIcon>
              </Link>
            </Group>
            <Burger
              opened={drawerOpened}
              onClick={toggleDrawer}
              hiddenFrom="sm"
              aria-label="Abrir menú"
              color="var(--color-teal)"
              style={{ flexShrink: 0 }}
            />
          </Group>
        </Container>
      </header>

      {/* Drawer móvil */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="xl"
        hiddenFrom="sm"
        withCloseButton
        classNames={{
          content: styles.mobileDrawer,
          header: styles.mobileDrawerHeader,
        }}
        title={
          <Text fw={700} c="white" size="lg">
            Care By Dani
          </Text>
        }
      >
        <Stack gap="xl" justify="space-between" style={{ minHeight: "70vh" }}>
          <Stack gap="lg" mt="xl">
            <Anchor
              href="#inicio"
              onClick={closeDrawer}
              className={styles.drawerLink}
            >
              Inicio
            </Anchor>
            <Anchor
              href="#servicios"
              onClick={closeDrawer}
              className={styles.drawerLink}
            >
              Servicios
            </Anchor>
            <Anchor
              href="#nosotros"
              onClick={closeDrawer}
              className={styles.drawerLink}
            >
              Nosotros
            </Anchor>
            <Anchor
              href="#trabaja-con-nosotros"
              onClick={closeDrawer}
              className={styles.drawerLink}
            >
              Trabaja con nosotros
            </Anchor>
            <Anchor
              href="#contacto"
              onClick={closeDrawer}
              className={styles.drawerLink}
            >
              Contacto
            </Anchor>
            <Link
              href="/admin/login"
              onClick={closeDrawer}
              style={{ textDecoration: "none" }}
            >
              <Text className={styles.drawerLink} style={{ opacity: 0.7 }}>
                Iniciar sesión
              </Text>
            </Link>
          </Stack>
          <Stack gap="md">
            <Anchor href="tel:+541171362057" style={{ textDecoration: "none" }}>
              <Button
                size="lg"
                radius="xl"
                fullWidth
                className={styles.ctaGold}
                leftSection={<IconPhone size={20} />}
              >
                +54 11-7136-2057
              </Button>
            </Anchor>
            <Text
              size="sm"
              ta="center"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Atención 24 hs, todos los días
            </Text>
          </Stack>
        </Stack>
      </Drawer>

      {/* Hero Section */}
      <section id="inicio" className={`${styles.hero} ${styles.heroDark}`}>
        <Container size="xl" className={styles.heroContainer}>
          <Grid gutter={60} align="center">
            <Grid.Col span={{ base: 12, lg: 5 }}>
              <Stack gap="xl" ta={{ base: "center", lg: "left" }}>
                <Title order={1} className={styles.heroTitle}>
                  El alivio de saber que están en las mejores manos.
                </Title>
                <Text size="xl" className={styles.heroSubtitle}>
                  Asistencia profesional, cálida y a medida para adultos
                  mayores. Devolvemos la tranquilidad a tu familia.
                </Text>
                <Group gap="md" wrap="wrap" className={styles.heroButtons}>
                  <Link href="#contacto">
                    <Button
                      size="lg"
                      radius="xl"
                      rightSection={<IconArrowRight size={20} />}
                      className={`${styles.heroButton} ${styles.ctaGold}`}
                    >
                      Solicitar Evaluación Gratuita
                    </Button>
                  </Link>
                  <Link href="#nosotros">
                    <Button
                      size="lg"
                      radius="xl"
                      className={`${styles.heroButton} ${styles.heroGhost}`}
                    >
                      Conocer servicios
                    </Button>
                  </Link>
                </Group>
                <Group gap="md" mt="md" className={styles.heroTrust}>
                  <Text size="sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Más de{" "}
                    <Text
                      component="span"
                      fw={700}
                      style={{ color: "var(--color-gold)" }}
                    >
                      500 familias
                    </Text>{" "}
                    confían en nosotros
                  </Text>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 7 }}>
              <Box className={styles.heroImageWrapper}>
                <Image
                  src="/cuidadora1.png"
                  alt="Cuidadora acompañando con calidez a una persona mayor en su hogar"
                  width={700}
                  height={600}
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "auto",
                    maxWidth: "100%",
                  }}
                  priority
                />
              </Box>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* Por qué elegirnos */}
      <section id="nosotros" className={styles.whySection}>
        <Container size="xl" className={styles.sectionContainer}>
          <Stack gap={60}>
            <div style={{ textAlign: "center" }}>
              <Title order={2} className={styles.sectionTitle} mb="md">
                ¿Por qué elegirnos?
              </Title>
              <Text size="lg" c="dimmed" maw={600} mx="auto">
                Entendemos que el cuidado de sus seres queridos es una
                prioridad. Nuestro enfoque se basa en la confianza, la empatía y
                la excelencia.
              </Text>
            </div>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
              <Card
                className={styles.featureCard}
                p="xl"
                radius="xl"
                withBorder
              >
                <Box className={styles.featureIcon} mb="lg">
                  <IconHeart size={48} />
                </Box>
                <Title order={3} mb="md">
                  Cuidado Compasivo
                </Title>
                <Text c="dimmed" lh={1.7}>
                  Tratamos a cada persona como si fuera de nuestra propia
                  familia, priorizando su dignidad y respeto en todo momento.
                </Text>
              </Card>
              <Card
                className={styles.featureCard}
                p="xl"
                radius="xl"
                withBorder
              >
                <Box className={styles.featureIcon} mb="lg">
                  <IconShieldCheck size={48} />
                </Box>
                <Title order={3} mb="md">
                  Personal Verificado
                </Title>
                <Text c="dimmed" lh={1.7}>
                  Todos nuestros cuidadores pasan por rigurosos procesos de
                  selección y antecedentes para garantizar su seguridad.
                </Text>
              </Card>
              <Card
                className={styles.featureCard}
                p="xl"
                radius="xl"
                withBorder
              >
                <Box className={styles.featureIcon} mb="lg">
                  <IconCalendar size={48} />
                </Box>
                <Title order={3} mb="md">
                  Flexibilidad Total
                </Title>
                <Text c="dimmed" lh={1.7}>
                  Adaptamos nuestros horarios y servicios a sus necesidades
                  específicas, desde unas horas hasta cuidado 24/7.
                </Text>
              </Card>
            </SimpleGrid>
          </Stack>
        </Container>
      </section>

      {/* Preguntas Frecuentes */}
      <section id="faq" className={styles.faqSection}>
        <Container size="xl" className={styles.sectionContainer}>
          <Grid gutter={60}>
            <Grid.Col span={{ base: 12, lg: 5 }}>
              <div className={styles.faqSticky}>
                <Title order={2} className={styles.sectionTitle} mb="md">
                  Preguntas Frecuentes
                </Title>
                <Text size="lg" c="dimmed">
                  Todo lo que necesitás saber sobre nuestro servicio de
                  asistencia domiciliaria.
                </Text>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 7 }}>
              <Accordion variant="separated" radius="xl" w="100%">
                <Accordion.Item value="que-es">
                  <Accordion.Control>
                    <Text fw={600}>¿Qué es Care By Dani?</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text c="dimmed" lh={1.7}>
                      Care By Dani es una empresa de asistencia domiciliaria y
                      enfermería. Brindamos cuidadores profesionales para
                      adultos mayores, personas en recuperación post-operatoria,
                      personas con discapacidad y personas con enfermedades
                      crónicas (Alzheimer, Parkinson, ACV, diabetes, EPOC) en el
                      AMBA.
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="solo-mayores">
                  <Accordion.Control>
                    <Text fw={600}>¿Solo atienden adultos mayores?</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text c="dimmed" lh={1.7}>
                      No. Atendemos a cualquier persona que necesite asistencia
                      domiciliaria: adultos mayores, personas en recuperación
                      post-operatoria, personas con discapacidad motriz o
                      cognitiva, y personas con enfermedades crónicas como
                      Alzheimer, Parkinson, ACV o diabetes.
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="enfermeria">
                  <Accordion.Control>
                    <Text fw={600}>¿Ofrecen enfermería domiciliaria?</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text c="dimmed" lh={1.7}>
                      Sí. Brindamos asistencia domiciliaria con cuidadores
                      entrenados: supervisión de medicación, acompañamiento
                      médico, control de signos vitales básicos y asistencia en
                      rehabilitación, tanto para adultos mayores como para
                      personas con condiciones crónicas o en recuperación.
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="zonas">
                  <Accordion.Control>
                    <Text fw={600}>¿En qué zonas trabajan?</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text c="dimmed" lh={1.7}>
                      Atendemos todo el AMBA: Ciudad Autónoma de Buenos Aires
                      (CABA), Zona Norte, Zona Sur y Zona Oeste del Gran Buenos
                      Aires.
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="24hs">
                  <Accordion.Control>
                    <Text fw={600}>¿Ofrecen cuidado 24 horas?</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text c="dimmed" lh={1.7}>
                      Sí. Disponemos de cuidadores para turnos de pocas horas
                      hasta cuidado domiciliario completo las 24 horas del día,
                      los 7 días de la semana.
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Grid.Col>
          </Grid>
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
                    objectFit: "cover",
                    width: "100%",
                    height: "auto",
                    maxWidth: "100%",
                  }}
                />
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6 }} order={{ base: 1, lg: 2 }}>
              <Stack gap="xl">
                <Title order={2} className={styles.sectionTitle}>
                  Asistencia integral para una vida plena
                </Title>
                <Stack gap="sm">
                  <Group
                    gap="md"
                    align="flex-start"
                    wrap="nowrap"
                    className={styles.serviceItem}
                  >
                    <Box className={styles.serviceIcon}>
                      <IconMedicalCross size={32} />
                    </Box>
                    <div>
                      <Title order={4} mb={4}>
                        Acompañamiento Médico
                      </Title>
                      <Text c="dimmed" size="sm">
                        Supervisión de medicación y acompañamiento a citas
                        médicas.
                      </Text>
                    </div>
                  </Group>
                  <Group
                    gap="md"
                    align="flex-start"
                    wrap="nowrap"
                    className={styles.serviceItem}
                  >
                    <Box className={styles.serviceIcon}>
                      <IconHome size={32} />
                    </Box>
                    <div>
                      <Title order={4} mb={4}>
                        Ayuda en el Hogar
                      </Title>
                      <Text c="dimmed" size="sm">
                        Apoyo en tareas domésticas específicas, preparación de
                        alimentos y organización.
                      </Text>
                    </div>
                  </Group>
                  <Group
                    gap="md"
                    align="flex-start"
                    wrap="nowrap"
                    className={styles.serviceItem}
                  >
                    <Box className={styles.serviceIcon}>
                      <IconUserCircle size={32} />
                    </Box>
                    <div>
                      <Title order={4} mb={4}>
                        Higiene Personal
                      </Title>
                      <Text c="dimmed" size="sm">
                        Asistencia digna y personalizada según las necesidades
                        de cada persona.
                      </Text>
                    </div>
                  </Group>
                  <Group
                    gap="md"
                    align="flex-start"
                    wrap="nowrap"
                    className={styles.serviceItem}
                  >
                    <Box className={styles.serviceIcon}>
                      <IconUsers size={32} />
                    </Box>
                    <div>
                      <Title order={4} mb={4}>
                        Compañía y Recreación
                      </Title>
                      <Text c="dimmed" size="sm">
                        Actividades como lectura, charlas, paseos y juegos,
                        orientadas al bienestar y la compañía.
                      </Text>
                    </div>
                  </Group>
                </Stack>
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* Testimonios */}
      <section className={styles.testimonialSection}>
        <Container size="md" className={styles.testimonialContainer}>
          <Stack gap="sm" align="center" ta="center" maw={760} mx="auto">
            <Text className={styles.testimonialQuote} aria-hidden="true">
              &ldquo;
            </Text>
            <Text
              c="white"
              fw={500}
              fz={{ base: "md", md: "lg" }}
              lh={1.6}
              style={{ fontStyle: "italic" }}
              maw={680}
            >
              Dani y su equipo no solo cuidaron a mi padre, sino que le
              devolvieron la alegría. Sentimos una paz inmensa sabiendo que
              estaba en las mejores manos.
            </Text>
            <Group gap="sm" mt="xs">
              <Box className={styles.testimonialAvatar}>
                <Image
                  src="/avatar-review.jpg"
                  alt="María González, hija de paciente"
                  width={56}
                  height={56}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
              <Stack gap={2} align="flex-start">
                <Text fw={600} c="white" size="md">
                  María González
                </Text>
                <Text c="white" opacity={0.7} size="xs">
                  Hija de paciente
                </Text>
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
                <Box style={{ width: "100%", overflow: "hidden" }}>
                  <Image
                    src="/cuidadora3.png"
                    alt="Cuidadora ayudando a una persona mayor"
                    width={600}
                    height={400}
                    style={{
                      objectFit: "cover",
                      borderRadius: "1rem",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                      width: "100%",
                      height: "auto",
                      maxWidth: "100%",
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
                    Contáctenos hoy para una consulta gratuita. Evaluaremos sus
                    necesidades y diseñaremos un plan de cuidado personalizado.
                  </Text>
                  <form onSubmit={handleContactSubmit}>
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      style={{
                        position: "absolute",
                        left: "-9999px",
                        width: 1,
                        height: 1,
                        opacity: 0,
                      }}
                    />
                    <Stack gap="md">
                      <Group grow>
                        <input
                          type="text"
                          placeholder="Nombre completo"
                          className={styles.contactInput}
                          value={contactForm.nombre}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              nombre: e.target.value,
                            })
                          }
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Teléfono"
                          className={styles.contactInput}
                          value={contactForm.telefono}
                          onChange={(e) =>
                            setContactForm({
                              ...contactForm,
                              telefono: e.target.value,
                            })
                          }
                        />
                      </Group>
                      <input
                        type="email"
                        placeholder="Correo electrónico"
                        className={styles.contactInput}
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                      <textarea
                        placeholder="¿Cómo podemos ayudarle?"
                        rows={3}
                        className={styles.contactInput}
                        value={contactForm.mensaje}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            mensaje: e.target.value,
                          })
                        }
                        required
                      />
                      <Button
                        type="submit"
                        size="lg"
                        radius="xl"
                        className={styles.ctaGold}
                        loading={submittingContact}
                        rightSection={<IconArrowRight size={18} />}
                      >
                        Enviar mensaje
                      </Button>
                      <Text className={styles.privacyNote}>
                        <IconLock size={14} /> Tus datos están protegidos y son
                        confidenciales.
                      </Text>
                    </Stack>
                  </form>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        </Container>
      </section>

      {/* Trabaja con Nosotros */}
      <section
        id="trabaja-con-nosotros"
        className={styles.contactSection}
        style={{ backgroundColor: "var(--surface-teal-soft)" }}
      >
        <Container size="xl" className={styles.sectionContainer}>
          <Paper
            className={`${styles.contactCard} ${styles.employmentCard}`}
            p="xl"
            radius="2xl"
          >
            <Grid gutter={60} align="center">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xl">
                  <Badge
                    color="primary"
                    variant="light"
                    size="lg"
                    radius="xl"
                    style={{
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Únete a Nuestro Equipo
                  </Badge>
                  <Title order={2} className={styles.sectionTitle}>
                    Forma parte de Care By Dani
                  </Title>
                  <Text size="lg" c="dimmed">
                    Buscamos cuidadores profesionales, empáticos y
                    comprometidos. Si tienes vocación de servicio, queremos
                    conocerte. Llena el formulario y nos contactaremos contigo a
                    la mayor brevedad.
                  </Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <form onSubmit={handleWorkSubmit}>
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    style={{
                      position: "absolute",
                      left: "-9999px",
                      width: 1,
                      height: 1,
                      opacity: 0,
                    }}
                  />
                  <Stack gap="md">
                    <Group grow>
                      <input
                        type="text"
                        placeholder="Nombre"
                        required
                        className={styles.contactInput}
                        value={workForm.nombre}
                        onChange={(e) =>
                          setWorkForm({ ...workForm, nombre: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Apellido"
                        required
                        className={styles.contactInput}
                        value={workForm.apellido}
                        onChange={(e) =>
                          setWorkForm({ ...workForm, apellido: e.target.value })
                        }
                      />
                    </Group>
                    <input
                      type="text"
                      placeholder="Zona de Trabajo (Ej: CABA, Zona Sur)"
                      required
                      className={styles.contactInput}
                      value={workForm.zonaTrabajo}
                      onChange={(e) =>
                        setWorkForm({
                          ...workForm,
                          zonaTrabajo: e.target.value,
                        })
                      }
                    />
                    <Group grow>
                      <input
                        type="email"
                        placeholder="Correo electrónico"
                        required
                        className={styles.contactInput}
                        value={workForm.email}
                        onChange={(e) =>
                          setWorkForm({ ...workForm, email: e.target.value })
                        }
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono"
                        required
                        className={styles.contactInput}
                        value={workForm.telefono}
                        onChange={(e) =>
                          setWorkForm({ ...workForm, telefono: e.target.value })
                        }
                      />
                    </Group>
                    <textarea
                      placeholder="¡Contanos tu experiencia! (Máximo 200 caracteres)"
                      maxLength={200}
                      rows={3}
                      className={styles.contactInput}
                      value={workForm.experiencia}
                      onChange={(e) =>
                        setWorkForm({
                          ...workForm,
                          experiencia: e.target.value,
                        })
                      }
                    />
                    <FileInput
                      placeholder="Adjuntar CV (PDF, DOC o DOCX — máx. 10MB)"
                      accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      leftSection={<IconPaperclip size={18} />}
                      value={cvFile}
                      onChange={handleCvChange}
                      clearable
                      size="md"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      radius="xl"
                      className={styles.ctaGold}
                      loading={submittingWork}
                      rightSection={<IconBriefcase size={18} />}
                    >
                      Enviar Postulación
                    </Button>
                    <Text className={styles.privacyNote}>
                      <IconLock size={14} /> Tus datos están protegidos y son
                      confidenciales.
                    </Text>
                  </Stack>
                </form>
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
              <Box mb="md" style={{ width: "100%", overflow: "hidden" }}>
                <Image
                  src="/image.png"
                  alt="Care By Dani Logo"
                  width={300}
                  height={300}
                  style={{
                    objectFit: "contain",
                    width: "clamp(120px, 30vw, 300px)",
                    height: "auto",
                    maxWidth: "100%",
                  }}
                />
              </Box>
              <Text size="sm" c="dimmed" mb="md">
                Dedicados a brindar cuidado humano, cálido y profesional. Su
                bienestar es nuestra misión.
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Text
                fw={600}
                size="sm"
                mb="md"
                style={{ textTransform: "uppercase", letterSpacing: "1px" }}
              >
                Enlaces Rápidos
              </Text>
              <Stack gap="xs">
                <Anchor href="#inicio" c="dimmed" size="sm" underline="never">
                  Inicio
                </Anchor>
                <Anchor
                  href="#servicios"
                  c="dimmed"
                  size="sm"
                  underline="never"
                >
                  Nuestros Servicios
                </Anchor>
                <Anchor href="#nosotros" c="dimmed" size="sm" underline="never">
                  Sobre Nosotros
                </Anchor>
                <Anchor href="#contacto" c="dimmed" size="sm" underline="never">
                  Contáctenos
                </Anchor>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Text
                fw={600}
                size="sm"
                mb="md"
                style={{ textTransform: "uppercase", letterSpacing: "1px" }}
              >
                Contacto
              </Text>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  Monteagudo 2933, Local 3
                </Text>
                <Text size="sm" c="dimmed">
                  +54 11-7136-2057
                </Text>
                <Text size="sm" c="dimmed">
                  contacto@carebydani.com
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Text
                fw={600}
                size="sm"
                mb="md"
                style={{ textTransform: "uppercase", letterSpacing: "1px" }}
              >
                Horario de Atención
              </Text>
              <Stack gap="xs">
                <Group gap="xs">
                  <Text size="sm" c="dimmed">
                    Lunes a Lunes:
                  </Text>
                  <Text size="sm" fw={600} c="dark.8">
                    24 hs
                  </Text>
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
          <Divider my="xl" />
          <Group justify="space-between" wrap="wrap">
            <Text size="sm" c="dimmed">
              © {new Date().getFullYear()} Care By Dani. Todos los derechos
              reservados.
            </Text>
            <Group gap="lg">
              <Anchor href="#" c="dimmed" size="sm" underline="never">
                Privacidad
              </Anchor>
              <Anchor href="#" c="dimmed" size="sm" underline="never">
                Términos
              </Anchor>
            </Group>
          </Group>
        </Container>
      </footer>
    </div>
  );
}
