'use client';

import { useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Configurar dayjs en español inmediatamente al cargar el módulo
dayjs.locale('es');

export function DayjsLocaleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Asegurar que dayjs esté en español después del mount
    dayjs.locale('es');
  }, []);

  return <>{children}</>;
}
