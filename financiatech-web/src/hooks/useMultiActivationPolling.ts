"use client";

import { useEffect, useRef, useState } from "react";
import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";

export interface LinkedDeviceInfo {
  deviceId: string;
  deviceName: string;
}

export function useMultiActivationPolling(
  activationCode: string,
  deviceIds: string[]
) {
  const [linkedDevices, setLinkedDevices] = useState<LinkedDeviceInfo[]>([]);
  const [allLinked, setAllLinked] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousLinkedCount = useRef(0);

  useEffect(() => {
    if (!activationCode || deviceIds.length === 0) return;

    const poll = async () => {
      try {
        const { data } = await clientAxios.get<{
          syncedDevices: Array<{
            deviceId: string;
            deviceName: string;
            synced: boolean;
          }>;
        }>(API_ROUTES.DEVICE_SYNCS.MULTI_SYNC_STATUS(activationCode));

        const linked = data.syncedDevices
          .filter((d) => d.synced)
          .map((d) => ({ deviceId: d.deviceId, deviceName: d.deviceName }));

        setLinkedDevices(linked);

        if (linked.length > previousLinkedCount.current) {
          previousLinkedCount.current = linked.length;
        }

        if (linked.length === deviceIds.length && linked.length > 0) {
          setAllLinked(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // Silencioso
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activationCode, deviceIds.length]);

  return { linkedDevices, allLinked };
}
