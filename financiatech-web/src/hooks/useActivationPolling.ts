"use client";

import { useEffect, useRef, useState } from "react";
import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";
import { IDevice } from "@/types";

export type SyncStatus = "waiting" | "success";

export interface ActivationPollResult {
  status: SyncStatus;
  device: IDevice | null;
}

export function useActivationPolling(
  activationCode: string
): ActivationPollResult {
  const [status, setStatus] = useState<SyncStatus>("waiting");
  const [device, setDevice] = useState<IDevice | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activationCode) return;

    const poll = async () => {
      try {
        const { data } = await clientAxios.get<{
          synced: boolean;
          device: IDevice;
        }>(API_ROUTES.DEVICE_SYNCS.SYNC_STATUS(activationCode));

        if (data.synced) {
          setDevice(data.device);
          setStatus("success");
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // Silencioso
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activationCode]);

  return { status, device };
}
