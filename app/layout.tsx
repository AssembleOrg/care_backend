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
  title: "CareByDani",
  description: "Gestión de cuidadores y pagos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <DayjsLocaleProvider>
          <MantineProvider theme={theme}>
            <DatesProvider settings={{ locale: 'es', firstDayOfWeek: 1 }}>
              <Notifications />
              {children}
            </DatesProvider>
          </MantineProvider>
        </DayjsLocaleProvider>
      </body>
    </html>
  );
}
