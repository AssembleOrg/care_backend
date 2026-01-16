import { prisma } from '@/src/infrastructure/database/PrismaService';
import { logger } from '@/src/infrastructure/logger/Logger';
import type { Prisma } from '@prisma/client';

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
  'password',
];

function redactPII(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactPII);
  }

  const redacted = { ...(data as Record<string, unknown>) };
  for (const key in redacted) {
    if (PII_FIELDS.includes(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactPII(redacted[key]);
    }
  }

  return redacted;
}

export interface AuditLogData {
  actor: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  recordId: string;
  oldData?: unknown;
  newData?: unknown;
  ip?: string;
  userAgent?: string;
}

export class AuditService {
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actor: data.actor,
          action: data.action,
          table: data.table,
          recordId: data.recordId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          oldData: data.oldData ? (redactPII(data.oldData) as any) : undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newData: data.newData ? (redactPII(data.newData) as any) : undefined,
          ip: data.ip,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      logger.error('Failed to create audit log', error);
      // Don't throw - audit failures shouldn't break the app
    }
  }
}

export const auditService = new AuditService();
