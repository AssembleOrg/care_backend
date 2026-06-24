import { prisma } from '@/src/infrastructure/database/PrismaService';
import { hashingService } from '@/src/infrastructure/crypto/HashingService';

/**
 * Rate limit por IP respaldado en DB (confiable en serverless, a diferencia
 * de un Map en memoria que no persiste entre invocaciones de funciones).
 *
 * Cuenta los envíos recientes de la misma IP para una ruta y, si está por
 * debajo del límite, registra el nuevo envío. La IP se guarda hasheada.
 */
export async function checkFormRateLimit(
    ip: string,
    routeKey: string,
    maxPerWindow: number,
    windowMs: number,
): Promise<{ allowed: boolean }> {
    const ipHash = hashingService.hash(ip);
    const since = new Date(Date.now() - windowMs);

    const count = await prisma.formSubmissionLog.count({
        where: { routeKey, ipHash, createdAt: { gte: since } },
    });

    if (count >= maxPerWindow) {
        return { allowed: false };
    }

    await prisma.formSubmissionLog.create({ data: { routeKey, ipHash } });
    return { allowed: true };
}

/**
 * Honeypot: campo oculto que un humano nunca completa. Si viene con valor,
 * casi seguro es un bot. Devuelve true cuando hay que rechazar.
 */
export function isHoneypotTriggered(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
}
