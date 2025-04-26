import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('8800244926', 10);

  await prisma.user.create({
    data: {
      name: 'Nikhil Sahni',
      rollNo: '2k22CSUN01074',
      password: hashedPassword,
      phone: '8800244926',
      email: 'nikhil.sahni321@gmail.com',
      clg: 'MRU', // enum value
      branch: 'SCHOOL_OF_ENGINEERING', // enum value
      role: 'STUDENT',
    },
  });

  console.log('✅ Student seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding student:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
