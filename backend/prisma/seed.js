const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main(){
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@dokwork.kz' },
    update: {},
    create: { email: 'admin@dokwork.kz', password: hash, name: 'Admin', role: 'admin' }
  });

  // sample housing
  await prisma.housing.createMany({ data: [
    { type: 'Хостел', city: 'Алматы', price: '20000', contact: '+7 700 000 0001' },
    { type: 'Квартира', city: 'Нур-Султан', price: '45000', contact: '+7 700 000 0002' }
  ]});

  // sample jobs
  await prisma.job.createMany({ data: [
    { title: 'Строитель', city: 'Алматы', salary: '150000', contact: '+7 700 000 0003' },
    { title: 'Водитель', city: 'Шымкент', salary: '180000', contact: '+7 700 000 0004' }
  ]});
}

main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
