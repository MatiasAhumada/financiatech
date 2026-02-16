/*
  Warnings:

  - Changed the type of `type` on the `devices` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('SMARTPHONE', 'TABLET', 'LAPTOP', 'DESKTOP', 'SMARTWATCH', 'OTHER');

-- AlterTable
ALTER TABLE "devices" DROP COLUMN "type",
ADD COLUMN     "type" "DeviceType" NOT NULL;
