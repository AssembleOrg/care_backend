/**
 * Script para limpiar todos los pagos y liquidaciones de la base de datos
 * Ejecutar con: pnpm tsx scripts/clean-pagos.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanPagos() {
  try {
    console.log('🧹 Limpiando todos los pagos y liquidaciones...');

    // Primero eliminar recibos adjuntos (tienen FK a Pago)
    const recibosDeleted = await prisma.reciboAdjunto.deleteMany({});
    console.log(`✅ Eliminados ${recibosDeleted.count} recibos adjuntos`);

    // Luego eliminar todos los pagos
    const pagosDeleted = await prisma.pago.deleteMany({});
    console.log(`✅ Eliminados ${pagosDeleted.count} pagos/liquidaciones`);

    console.log('✨ Limpieza completada exitosamente');
  } catch (error) {
    console.error('❌ Error al limpiar pagos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanPagos();
