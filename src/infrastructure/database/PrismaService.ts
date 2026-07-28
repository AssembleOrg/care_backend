import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Se usa el driver `pg` en lugar del engine por defecto.
 *
 * Con `?pgbouncer=true` Prisma desactiva los prepared statements y rodea cada
 * consulta con BEGIN / DEALLOCATE ALL / COMMIT: son cuatro viajes de ida y
 * vuelta por query, y contra Supabase (us-east-2) eso medía ~980 ms por una
 * consulta trivial. Con el adaptador de `pg` la misma query tarda ~200 ms,
 * sin resignar el pooler en modo transacción, que es el que conviene en
 * serverless.
 */
function crearCliente(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  return new PrismaClient({
    ...(connectionString ? { adapter: new PrismaPg({ connectionString }) } : {}),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export class PrismaService {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = global.prisma || crearCliente();

      if (process.env.NODE_ENV !== 'production') {
        global.prisma = PrismaService.instance;
      }
    }

    return PrismaService.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
    }
  }
}

export const prisma = PrismaService.getInstance();
