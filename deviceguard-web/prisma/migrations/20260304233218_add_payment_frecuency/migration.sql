/*
  Warnings:

  - You are about to drop the column `monthlyAmount` on the `sales` table. All the data in the column will be lost.
  - Added the required column `installmentAmount` to the `sales` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "financing_plans" ADD COLUMN     "paymentFrequency" "PaymentFrequency" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "sales" DROP COLUMN "monthlyAmount",
ADD COLUMN     "installmentAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "paymentFrequency" "PaymentFrequency" NOT NULL DEFAULT 'MONTHLY';
