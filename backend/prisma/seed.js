// backend/prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  // hash password
  const password = await bcrypt.hash("test123", 10);

  // create demo user
  await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@example.com",
      password,
      role: "CUSTOMER",
    },
  });

  // create demo products
  await prisma.product.createMany({
    data: [
      {
        name: "Canon DSLR Camera",
        description: "Professional DSLR for rent.",
        unit: "DAY",
        basePriceDay: 1000,
        quantity: 5,
      },
      {
        name: "Epson Projector",
        description: "HD projector for events.",
        unit: "DAY",
        basePriceDay: 1500,
        quantity: 3,
      },
      {
        name: "Bosch Drill",
        description: "Heavy-duty drill machine.",
        unit: "HOUR",
        basePriceHour: 50,
        quantity: 10,
      },
    ],
  });

  console.log("Seeding finished ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
