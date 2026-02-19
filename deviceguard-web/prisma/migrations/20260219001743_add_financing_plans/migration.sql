-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "financingPlanId" TEXT;

-- CreateTable
CREATE TABLE "financing_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "installments" INTEGER NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "financing_plans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_financingPlanId_fkey" FOREIGN KEY ("financingPlanId") REFERENCES "financing_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financing_plans" ADD CONSTRAINT "financing_plans_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
