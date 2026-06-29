import type { Metadata } from "next";
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { Notifications } from "@mantine/notifications";
import { theme } from "@/src/presentation/theme/mantine-theme";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";
import { DayjsLocaleProvider } from "./dayjs-locale-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://carebydani.com.ar"),
  title: {
    default: "Care By Dani — Asistencia domiciliaria y enfermería en AMBA",
    template: "%s | Care By Dani",
  },
  description:
    "Asistencia domiciliaria profesional para adultos mayores, recuperación post-operatoria, personas con discapacidad y enfermedades crónicas en AMBA. Cuidadores verificados, enfermería a domicilio y cuidado 24 hs. Más de 500 familias confían en nosotros.",
  keywords: [
    "cuidado de adultos mayores",
    "cuidado de personas mayores",
    "cuidadores domiciliarios",
    "asistencia domiciliaria",
    "enfermería domiciliaria",
    "acompañamiento de ancianos",
    "asistencia geriátrica",
    "cuidado a domicilio",
    "cuidadores AMBA",
    "cuidadores Buenos Aires",
    "enfermera domiciliaria",
    "acompañante terapéutico",
    "gerontología domiciliaria",
    "cuidador de abuelos",
    "asistencia para ancianos Buenos Aires",
    "cuidados post operatorios en casa",
    "asistencia para personas con discapacidad",
    "cuidado de personas con Alzheimer",
    "cuidado de personas con Parkinson",
    "cuidado de personas con ACV",
    "asistencia para enfermedades crónicas",
    "recuperación en casa tras cirugía",
    "cuidado integral en el hogar",
    "Care By Dani",
  ],
  authors: [{ name: "Care By Dani" }],
  creator: "Care By Dani",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://carebydani.com.ar",
    siteName: "Care By Dani",
    title: "Care By Dani — Asistencia domiciliaria y enfermería en AMBA",
    description:
      "Cuidadores profesionales verificados en AMBA para adultos mayores, post-operatorios, discapacidad y enfermedades crónicas. Enfermería domiciliaria y cuidado 24 hs.",
    images: [
      {
        url: "/cuidadora1.png",
        width: 600,
        height: 500,
        alt: "Cuidadora de Care By Dani acompañando a una persona mayor en su hogar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Care By Dani — Asistencia domiciliaria y enfermería en AMBA",
    description:
      "Cuidadores profesionales verificados en AMBA. Adultos mayores, post-operatorios, discapacidad y enfermedades crónicas. Cuidado 24 hs.",
    images: ["/cuidadora1.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const organizationId = "https://carebydani.com.ar/#organization";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["LocalBusiness", "HomeHealthCareService"],
      "@id": organizationId,
      name: "Care By Dani",
      description:
        "Asistencia domiciliaria profesional en AMBA para adultos mayores, personas en recuperación post-operatoria, personas con discapacidad y personas con enfermedades crónicas (Alzheimer, Parkinson, ACV, diabetes). Cuidadores verificados, enfermería domiciliaria y cuidado 24 horas.",
      disambiguatingDescription:
        "Care By Dani es una empresa de CUIDADO Y ASISTENCIA DOMICILIARIA para personas que necesitan apoyo en su hogar: adultos mayores, post-operatorios, discapacidad y enfermedades crónicas. No es una veterinaria, no cuida mascotas, no ofrece servicios de belleza ni estética.",
      image: "https://carebydani.com.ar/cuidadora1.png",
      url: "https://carebydani.com.ar",
      telephone: "+541171362057",
      email: "contacto@carebydani.com",
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Monteagudo 2933, Local 3",
        addressLocality: "Ciudad Autónoma de Buenos Aires",
        addressRegion: "CABA",
        addressCountry: "AR",
      },
      areaServed: {
        "@type": "Place",
        name: "AMBA — Área Metropolitana de Buenos Aires",
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "00:00",
          closes: "23:59",
        },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Servicios de cuidado domiciliario",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Acompañamiento médico y supervisión de medicación",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Ayuda en el hogar y preparación de alimentos",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Asistencia en higiene personal",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Compañía y recreación para adultos mayores",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Cuidado domiciliario 24 horas",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Asistencia post-operatoria en el hogar",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Cuidado de personas con Alzheimer, Parkinson o ACV",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Apoyo domiciliario para personas con discapacidad",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Enfermería domiciliaria y control de medicación crónica",
            },
          },
        ],
      },
    },
    {
      "@type": "Service",
      name: "Asistencia domiciliaria y enfermería profesional en AMBA",
      provider: { "@id": organizationId },
      serviceType: "Home Health Care",
      description:
        "Cuidado domiciliario personalizado para adultos mayores, personas en recuperación post-operatoria, personas con discapacidad y personas con enfermedades crónicas (Alzheimer, Parkinson, ACV, diabetes, EPOC). Cuidadores profesionales, acompañamiento médico, higiene personal y cuidado 24/7 en el AMBA.",
      areaServed: "AMBA — Área Metropolitana de Buenos Aires, Argentina",
      audience: {
        "@type": "PeopleAudience",
        audienceType:
          "Adultos mayores, personas en recuperación post-operatoria, personas con discapacidad, personas con enfermedades crónicas y sus familias",
      },
      url: "https://carebydani.com.ar/#servicios",
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Qué es Care By Dani?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Care By Dani es una empresa argentina de asistencia domiciliaria y enfermería. Brindamos cuidadores profesionales para adultos mayores, personas en recuperación post-operatoria, personas con discapacidad y personas con enfermedades crónicas (Alzheimer, Parkinson, ACV, diabetes, EPOC) en el AMBA (Área Metropolitana de Buenos Aires).",
          },
        },
        {
          "@type": "Question",
          name: "¿Care By Dani solo atiende adultos mayores?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No, no solo adultos mayores. Care By Dani atiende a cualquier persona que necesite asistencia domiciliaria: adultos mayores, personas en recuperación post-operatoria, personas con discapacidad motriz o cognitiva, y personas con enfermedades crónicas como Alzheimer, Parkinson, ACV, diabetes o EPOC.",
          },
        },
        {
          "@type": "Question",
          name: "¿Care By Dani cuida mascotas o animales?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Care By Dani no es una veterinaria ni ofrece servicios de cuidado de mascotas. Nos especializamos exclusivamente en el cuidado de personas que necesitan asistencia domiciliaria.",
          },
        },
        {
          "@type": "Question",
          name: "¿Care By Dani ofrece servicios de belleza o estética?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. No somos un salón de belleza ni ofrecemos tratamientos estéticos. Nuestro servicio es exclusivamente asistencia domiciliaria para personas mayores: acompañamiento médico, higiene personal, compañía y cuidado integral.",
          },
        },
        {
          "@type": "Question",
          name: "¿En qué zonas trabaja Care By Dani?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Atendemos todo el AMBA: Ciudad Autónoma de Buenos Aires (CABA), Zona Norte, Zona Sur y Zona Oeste del Gran Buenos Aires.",
          },
        },
        {
          "@type": "Question",
          name: "¿Ofrecen enfermería domiciliaria?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Brindamos asistencia domiciliaria con cuidadores entrenados para necesidades de salud: supervisión de medicación, acompañamiento médico, control de signos vitales básicos y asistencia en rehabilitación, tanto para adultos mayores como para personas con condiciones crónicas o en recuperación.",
          },
        },
        {
          "@type": "Question",
          name: "¿Ofrecen cuidado 24 horas?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Disponemos de cuidadores para turnos de pocas horas hasta cuidado domiciliario completo las 24 horas del día, los 7 días de la semana.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <DayjsLocaleProvider>
          <MantineProvider theme={theme}>
            <DatesProvider settings={{ locale: "es", firstDayOfWeek: 1 }}>
              <Notifications position="top-right" zIndex={1000} />
              {children}
            </DatesProvider>
          </MantineProvider>
        </DayjsLocaleProvider>
      </body>
    </html>
  );
}
