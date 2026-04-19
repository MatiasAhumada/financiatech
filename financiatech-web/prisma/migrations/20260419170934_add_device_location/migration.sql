-- CreateTable
CREATE TABLE "device_locations" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_device_locations_device_time" ON "device_locations"("deviceId", "timestamp");

-- CreateIndex
CREATE INDEX "idx_device_locations_received" ON "device_locations"("receivedAt");

-- AddForeignKey
ALTER TABLE "device_locations" ADD CONSTRAINT "device_locations_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "device_syncs"("deviceId") ON DELETE CASCADE ON UPDATE CASCADE;
