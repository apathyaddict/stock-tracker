import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@stocktracker.com" },
    update: {},
    create: {
      email: "demo@stocktracker.com",
      name: "Demo User",
      password: await bcrypt.hash("demo123", 10),
    },
  });

  console.log(`Seeded demo user: ${demoUser.email}`);
}

main()
  .catch((e) => {
    console.error("Seed failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
