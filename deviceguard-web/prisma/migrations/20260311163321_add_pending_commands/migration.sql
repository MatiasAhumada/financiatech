-- DropIndex
DROP INDEX "idx_device_syncs_imei";

-- CreateTable
CREATE TABLE "pending_commands" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "ackedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pending_commands_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pending_commands" ADD CONSTRAINT "pending_commands_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "device_syncs"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;
