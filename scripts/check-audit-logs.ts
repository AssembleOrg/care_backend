import { prisma } from '../src/infrastructure/database/PrismaService';

async function checkAuditLogs() {
  try {
    console.log('🔍 Verificando AuditLogs...\n');

    // Contar total de logs
    const totalLogs = await prisma.auditLog.count();
    console.log(`📊 Total de AuditLogs: ${totalLogs}\n`);

    if (totalLogs === 0) {
      console.log('⚠️  No hay registros en AuditLog');
      console.log('\n🔍 Verificando si hay cuidadores en la base de datos...');
      const totalCuidadores = await prisma.cuidador.count();
      console.log(`📊 Total de Cuidadores: ${totalCuidadores}`);
      
      if (totalCuidadores > 0) {
        console.log('\n⚠️  Hay cuidadores pero no hay logs. Esto significa que:');
        console.log('   1. Los cuidadores fueron creados antes de implementar AuditLog, o');
        console.log('   2. El AuditService no se está ejecutando correctamente');
      }
      return;
    }

    // Obtener los últimos 10 logs
    const logs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        actor: true,
        action: true,
        table: true,
        recordId: true,
        createdAt: true,
        newData: true,
      },
    });

    console.log(`📋 Últimos ${logs.length} AuditLogs:\n`);
    logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} en ${log.table}`);
      console.log(`   ID: ${log.id}`);
      console.log(`   RecordId: ${log.recordId}`);
      console.log(`   Actor: ${log.actor}`);
      console.log(`   Fecha: ${log.createdAt.toISOString()}`);
      if (log.newData) {
        console.log(`   Datos: ${JSON.stringify(log.newData)}`);
      }
      console.log('');
    });

    // Agrupar por tabla
    const byTable = await prisma.auditLog.groupBy({
      by: ['table'],
      _count: {
        id: true,
      },
    });

    console.log('📊 Logs por tabla:');
    byTable.forEach((group) => {
      console.log(`   ${group.table}: ${group._count.id}`);
    });

    // Agrupar por acción
    const byAction = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        id: true,
      },
    });

    console.log('\n📊 Logs por acción:');
    byAction.forEach((group) => {
      console.log(`   ${group.action}: ${group._count.id}`);
    });

    // Verificar si hay cuidadores sin logs
    console.log('\n🔍 Verificando cuidadores sin logs...');
    const cuidadores = await prisma.cuidador.findMany({
      select: {
        id: true,
        nombreCompleto: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    console.log(`\n📋 Últimos ${cuidadores.length} cuidadores:`);
    for (const cuidador of cuidadores) {
      const log = await prisma.auditLog.findFirst({
        where: {
          table: 'Cuidador',
          recordId: cuidador.id,
          action: 'CREATE',
        },
      });

      if (log) {
        console.log(`   ✅ ${cuidador.nombreCompleto} (${cuidador.id}) - Tiene log`);
      } else {
        console.log(`   ❌ ${cuidador.nombreCompleto} (${cuidador.id}) - NO tiene log`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditLogs();
