import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        superAdmin: true,
        admin: true,
      },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        superAdmin: true,
        admin: true,
      },
    });
  }

  async createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      include: {
        superAdmin: true,
        admin: true,
      },
    });
  }

  async createSuperAdmin(userId: string) {
    return prisma.superAdmin.create({
      data: { userId },
    });
  }

  async createAdmin(userId: string, superAdminId: string) {
    return prisma.admin.create({
      data: {
        userId,
        superAdminId,
      },
    });
  }
}
