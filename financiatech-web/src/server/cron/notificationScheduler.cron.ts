/**
 * Script para ejecutar el notification scheduler automáticamente
 * Este script puede ser ejecutado por:
 * 1. Un cron job del sistema operativo
 * 2. node-cron package
 * 3. PM2 con schedule
 * 4. Ejecución manual vía API
 * 
 * Para usar con node-cron, instalar: pnpm add node-cron
 * 
 * Ejemplo de uso con cron del sistema:
 * 0 9 * * * cd /path/to/financiatech-web && node --loader tsx src/server/cron/notificationScheduler.cron.ts
 * 
 * Esto ejecutará el scheduler todos los días a las 9:00 AM
 */

import { notificationSchedulerService } from "../services/notificationScheduler.service";

const SCHEDULER_INTERVAL = 60 * 60 * 1000;

async function runScheduler() {
  try {
    console.log("[CRON] Iniciando notification scheduler...");
    console.log(`[CRON] Fecha: ${new Date().toISOString()}`);

    const results = await notificationSchedulerService.runFullScheduler();

    console.log("[CRON] === RESUMEN DE EJECUCIÓN ===");
    console.log(`[CRON] Warning 1: ${results.warning1.length} dispositivos`);
    results.warning1.forEach((r) => {
      console.log(
        `  - ${r.deviceName} (${r.clientName}): ${r.success ? "✓" : "✗"} ${r.message}`
      );
    });

    console.log(`[CRON] Warning 2: ${results.warning2.length} dispositivos`);
    results.warning2.forEach((r) => {
      console.log(
        `  - ${r.deviceName} (${r.clientName}): ${r.success ? "✓" : "✗"} ${r.message}`
      );
    });

    console.log(
      `[CRON] Block Warning: ${results.blockWarning.length} dispositivos`
    );
    results.blockWarning.forEach((r) => {
      console.log(
        `  - ${r.deviceName} (${r.clientName}): ${r.success ? "✓" : "✗"} ${r.message}`
      );
    });

    console.log(`[CRON] Block: ${results.block.length} dispositivos`);
    results.block.forEach((r) => {
      console.log(
        `  - ${r.deviceName} (${r.clientName}): ${r.success ? "✓" : "✗"} ${r.message}`
      );
    });

    const totalProcessed =
      results.warning1.length +
      results.warning2.length +
      results.blockWarning.length +
      results.block.length;

    console.log(`[CRON] Total procesado: ${totalProcessed} dispositivos`);
    console.log("[CRON] Scheduler finalizado exitosamente");
  } catch (error) {
    console.error("[CRON] Error ejecutando scheduler:", error);
  }
}

runScheduler();
setInterval(runScheduler, SCHEDULER_INTERVAL);
