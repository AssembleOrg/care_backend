import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear admin si no existe
  const adminEmail = 'admin@carebydani.com';
  const adminPassword = 'Admin123!'; // Cambiar en producción

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin ya existe:', adminEmail);
  } else {
    const hashedPassword = await hash(adminPassword, 10);
    
    const admin = await prisma.admin.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
      },
    });

    console.log('✅ Admin creado:', admin.email);
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  IMPORTANTE: Cambiar la contraseña después del primer login');
  }

  console.log('✨ Seed completado');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
