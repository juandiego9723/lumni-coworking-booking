import { PrismaClient, Role, RoomSize } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'cliente@lumni.com' },
    update: {},
    create: {
      email: 'cliente@lumni.com',
      name: 'Juan Cliente',
      role: Role.CLIENT,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@lumni.com' },
    update: {},
    create: {
      email: 'admin@lumni.com',
      name: 'Laura Admin',
      role: Role.ADMIN,
    },
  });

  const rooms = [
    { name: 'Sala Pequeña (1-4 personas)', size: RoomSize.SMALL, hourlyRate: 40000 },
    { name: 'Sala Mediana (5-8 personas)', size: RoomSize.MEDIUM, hourlyRate: 70000 },
    { name: 'Sala Grande (9-16 personas)', size: RoomSize.LARGE, hourlyRate: 120000 },
  ];

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { size: r.size },
      update: { name: r.name, hourlyRate: r.hourlyRate },
      create: r,
    });
  }

  console.log('Seed completado: 2 usuarios y 3 salas creadas.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
