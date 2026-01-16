import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export class PrismaService {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance =
        global.prisma ||
        new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });

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
