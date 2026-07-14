import { PrismaClient } from "@prisma/client";
import config from "../src/config";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash(
    "123456",
    Number(config.jwt.gen_salt),
  );

  // ADMIN
  await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      email: "admin@gmail.com",
      phoneNumber: "1700000000",
      countryCode: "+880",
      fullName: "ProjectAdmin",
      password: hashedPassword,
      role: "Admin",
      referralCode: "ADMIN123",
    },
  });

  // Brand
  await prisma.user.upsert({
    where: { email: "brand@gmail.com" },
    update: {},
    create: {
      email: "brand@gmail.com",
      phoneNumber: "1700000001",
      countryCode: "+880",
      fullName: "ProjectBrand",
      password: hashedPassword,
      role: "Brand",
      referralCode: "BRAND123",
    },
  });

  // Buyer
  await prisma.user.upsert({
    where: { email: "buyer@gmail.com" },
    update: {},
    create: {
      email: "buyer@gmail.com",
      phoneNumber: "1700000002",
      countryCode: "+880",
      fullName: "ProjectBuyer",
      password: hashedPassword,
      role: "Buyer",
      referralCode: "BUYER123",
    },
  });

  console.log("✅ Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
