-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_device_syncs_imei" ON "device_syncs"("imei");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_devices_status" ON "devices"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_installments_device_status_due" ON "installments"("deviceId", "status", "dueDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_device_syncs_lastping" ON "device_syncs"("lastPing");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_sales_activation_code" ON "sales"("activationCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_devices_admin_status" ON "devices"("adminId", "status");
