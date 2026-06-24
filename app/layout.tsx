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
    default: "Care By Dani — Cuidado profesional de adultos mayores en AMBA",
    template: "%s | Care By Dani",
  },
  description:
    "Cuidadores profesionales y empáticos para adultos mayores en AMBA (Buenos Aires). Acompañamiento médico, asistencia domiciliaria y cuidado 24 hs. Más de 500 familias confían en nosotros.",
  keywords: [
    "cuidado de adultos mayores",
    "cuidadores domiciliarios",
    "acompañamiento de ancianos",
    "asistencia geriátrica",
    "cuidado a domicilio",
    "cuidadores AMBA",
    "cuidadores Buenos Aires",
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
    title: "Care By Dani — Cuidado profesional de adultos mayores en AMBA",
    description:
      "Cuidadores profesionales y empáticos para adultos mayores en AMBA. Acompañamiento médico, asistencia domiciliaria y cuidado 24 hs.",
    images: [
      {
        url: "/cuidadora1.png",
        width: 600,
        height: 500,
        alt: "Cuidadora de Care By Dani acompañando a una persona mayor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Care By Dani — Cuidado profesional de adultos mayores en AMBA",
    description:
      "Cuidadores profesionales y empáticos para adultos mayores en AMBA. Cuidado 24 hs.",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Care By Dani",
  description:
    "Cuidadores profesionales y empáticos para adultos mayores en AMBA. Acompañamiento médico, asistencia domiciliaria y cuidado 24 hs.",
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
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
            <DatesProvider settings={{ locale: 'es', firstDayOfWeek: 1 }}>
              <Notifications position="top-right" zIndex={1000} />
              {children}
            </DatesProvider>
          </MantineProvider>
        </DayjsLocaleProvider>
      </body>
    </html>
  );
}
