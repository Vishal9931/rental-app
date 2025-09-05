// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const pass = await bcrypt.hash('password123', 10);

  // create a test user
  await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'user@example.com',
      password: pass,
      role: 'CUSTOMER'
    }
  });

  // create some demo products
  await prisma.product.createMany({
    data: [
      { name: 'Canon DSLR', unit: 'DAY', basePriceDay: 1000, quantity: 3 },
      { name: 'Epson Projector', unit: 'DAY', basePriceDay: 1500, quantity: 2 },
      { name: 'Bosch Drill', unit: 'HOUR', basePriceHour: 50, quantity: 5 }
    ]
  });

  // optional: add a pricelist rule
  await prisma.pricelistRule.create({
    data: {
      name: 'Weekly Discount',
      kind: 'duration',
      percent: 20,
      minDays: 7
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
