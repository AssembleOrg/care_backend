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
      const oldDataJson = data.oldData ? JSON.stringify(redactPII(data.oldData)) : null;
      const newDataJson = data.newData ? JSON.stringify(redactPII(data.newData)) : null;
      
      // Insertar directamente - el trigger validará solo la foreign key correcta
      await prisma.$executeRawUnsafe(
        `INSERT INTO "AuditLog" (id, actor, action, "table", "recordId", "oldData", "newData", ip, "userAgent", "createdAt")
         VALUES (gen_random_uuid()::text, $1::text, $2::text, $3::text, $4::text, $5::jsonb, $6::jsonb, $7::text, $8::text, NOW())`,
        data.actor,
        data.action,
        data.table,
        data.recordId,
        oldDataJson,
        newDataJson,
        data.ip || null,
        data.userAgent || null
      );
      
      console.log('✅ AuditLog creado:', { table: data.table, action: data.action, recordId: data.recordId });
    } catch (error) {
      console.error('❌ Error al crear AuditLog:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        // Si es un error de foreign key, ejecuta la migración fix_auditlog_foreign_keys_v2.sql
        if (error.message.includes('foreign key') || error.message.includes('constraint')) {
          console.error('⚠️  Ejecuta la migración fix_auditlog_foreign_keys_v2.sql para usar triggers en lugar de foreign keys');
        }
      }
      logger.error('Failed to create audit log', error);
      // Don't throw - audit failures shouldn't break the app
    }
  }
}

export const auditService = new AuditService();
