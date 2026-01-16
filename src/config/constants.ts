export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const RATE_LIMIT_LOGIN_ATTEMPTS = 5;
export const RATE_LIMIT_LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const SESSION_COOKIE_NAME = 'carebydani_session';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export const METODO_PAGO = {
  EFECTIVO: 'EFECTIVO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  OTRO: 'OTRO',
} as const;

export type MetodoPago = (typeof METODO_PAGO)[keyof typeof METODO_PAGO];
