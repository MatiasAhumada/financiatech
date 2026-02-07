import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: "superadmin@deviceguard.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "superadmin@deviceguard.com",
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.superAdmin.upsert({
    where: { userId: superAdminUser.id },
    update: {},
    create: {
      userId: superAdminUser.id,
    },
  });

  console.log("Seed completed successfully");
  console.log("Super Admin created:");
  console.log("Email: superadmin@deviceguard.com");
  console.log("Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
