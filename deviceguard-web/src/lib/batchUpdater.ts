import { prisma } from "./prisma";

class BatchUpdater {
  private pendingUpdates = new Set<string>();
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.flush();
    }, 60000);

    console.log("✅ Batch updater started");
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.flush();
    }
  }

  addDeviceId(deviceId: string) {
    this.pendingUpdates.add(deviceId);
  }

  private async flush() {
    if (this.pendingUpdates.size === 0) return;

    const deviceIds = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();

    try {
      await prisma.deviceSync.updateMany({
        where: {
          deviceId: {
            in: deviceIds,
          },
        },
        data: {
          lastPing: new Date(),
        },
      });

      console.log(`✅ Updated lastPing for ${deviceIds.length} devices`);
    } catch (error) {
      console.error("❌ Error updating lastPing batch:", error);
    }
  }
}

export const batchUpdater = new BatchUpdater();

