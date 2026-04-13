-- CreateEnum
CREATE TYPE "NotificationTrigger" AS ENUM ('SCHEDULED', 'MANUAL');

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_installmentId_fkey";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "dayOfMonth" INTEGER,
ADD COLUMN     "dayOfWeek" INTEGER,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "executedBy" TEXT,
ADD COLUMN     "success" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "trigger" "NotificationTrigger" NOT NULL DEFAULT 'SCHEDULED';

-- CreateIndex
CREATE INDEX "idx_notifications_device_sent" ON "notifications"("deviceId", "sentAt");

-- CreateIndex
CREATE INDEX "idx_notifications_type_trigger" ON "notifications"("type", "trigger");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "installments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
