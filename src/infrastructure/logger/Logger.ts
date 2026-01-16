const PII_FIELDS = [
  'dniEnc',
  'dniHash',
  'telefonoEnc',
  'telefonoHash',
  'emailEnc',
  'emailHash',
  'direccionEnc',
  'direccionHash',
  'telefonoContactoEmergenciaEnc',
  'telefonoContactoEmergenciaHash',
  'nombreCompleto',
  'password',
];

function redactPII(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactPII);
  }

  const redacted = { ...(obj as Record<string, unknown>) };
  for (const key in redacted) {
    if (PII_FIELDS.includes(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactPII(redacted[key]);
    }
  }

  return redacted;
}

export class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private formatMessage(level: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(redactPII(data))}` : '';
    return `[${timestamp}] [${level}] [${this.context}] ${message}${dataStr}`;
  }

  info(message: string, data?: unknown): void {
    console.log(this.formatMessage('INFO', message, data));
  }

  warn(message: string, data?: unknown): void {
    console.warn(this.formatMessage('WARN', message, data));
  }

  error(message: string, error?: Error | unknown): void {
    const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(this.formatMessage('ERROR', message, errorData));
  }

  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }
}

export const logger = new Logger();
