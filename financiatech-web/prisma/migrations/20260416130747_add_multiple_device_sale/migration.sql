-- DropIndex
DROP INDEX "sales_activationCode_key";

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "deviceCount" INTEGER NOT NULL DEFAULT 1;
