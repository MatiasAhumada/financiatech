import { LRUCache } from "lru-cache";
import { DeviceStatusCheckResult } from "@/types";

const deviceStatusCache = new LRUCache<string, DeviceStatusCheckResult>({
  max: 1000,
  ttl: 25000,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

export const cache = {
  get: (key: string): DeviceStatusCheckResult | undefined => {
    return deviceStatusCache.get(key);
  },

  set: (key: string, value: DeviceStatusCheckResult): void => {
    deviceStatusCache.set(key, value);
  },

  delete: (key: string): void => {
    deviceStatusCache.delete(key);
  },

  clear: (): void => {
    deviceStatusCache.clear();
  },

  invalidateDevice: (imei: string): void => {
    deviceStatusCache.delete(`device:${imei}`);
  },

  stats: () => ({
    size: deviceStatusCache.size,
    max: deviceStatusCache.max,
    calculatedSize: deviceStatusCache.calculatedSize,
  }),
};
