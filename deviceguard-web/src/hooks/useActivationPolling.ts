"use client";

import { useEffect, useRef, useState } from "react";
import clientAxios from "@/utils/clientAxios.util";
import { API_ROUTES } from "@/constants/routes";


export type SyncStatus = "waiting" | "success";

export interface ActivationPollResult {
  status: SyncStatus;
  deviceName: string;
}

/**
 * Hook que hace polling al endpoint GET /api/sales/{activationCode}/sync
 * cada 3 segundos hasta detectar que el dispositivo fue vinculado.
 *
 * SRP: solo encapsula la lógica de petición + intervalo + cleanup.
 * El componente que lo consuma decide qué renderizar según el estado.
 */
export function useActivationPolling(
  activationCode: string
): ActivationPollResult {
  const [status, setStatus] = useState<SyncStatus>("waiting");
  const [deviceName, setDeviceName] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activationCode) return;

    const poll = async () => {
      try {
        const { data } = await clientAxios.get<{
          synced: boolean;
          deviceName: string;
        }>(API_ROUTES.DEVICE_SYNCS.SYNC_STATUS(activationCode));


        if (data.synced) {
          setDeviceName(data.deviceName);
          setStatus("success");
          // Detener el intervalo: ya no hay nada más que esperar
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // Red caída, 404, o error del servidor — silencioso, el intervalo reintentará
      }
    };

    // Primera llamada inmediata para no esperar 3s al montar
    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activationCode]);

  return { status, deviceName };
}
