import dayjs from 'dayjs';

/**
 * Formato de fecha único para toda la web: DD/MM/YYYY.
 * Centralizado para evitar `toLocaleDateString()` sin locale (que cae en
 * el locale del server y puede renderizar MM/DD/YYYY).
 */
export function formatDate(value: string | number | Date | null | undefined): string {
    if (!value) return '-';
    const d = dayjs(value);
    return d.isValid() ? d.format('DD/MM/YYYY') : '-';
}

/** Fecha + hora: DD/MM/YYYY HH:mm */
export function formatDateTime(value: string | number | Date | null | undefined): string {
    if (!value) return '-';
    const d = dayjs(value);
    return d.isValid() ? d.format('DD/MM/YYYY HH:mm') : '-';
}
