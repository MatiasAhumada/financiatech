import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { YStack, Text, Button } from "tamagui";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Dimensions, NativeModules, Platform } from "react-native";
import { useDeviceImei } from "@/src/hooks/useDeviceImei";
import { provisioningService } from "@/src/services/provisioning.service";
import { useKioskMode } from "@/src/hooks/useKioskMode";

export default function DeviceBlockedScreen() {
  const router = useRouter();
  const { deviceId, isReady } = useDeviceImei();
  const [pending, setPending] = useState<number | null>(null);
  const navigation = useNavigation();
  const isUnblockedRef = useRef(false);

  // Inicializar Background polling service por si esta pantalla
  // se carga directo post-reinicio sin haber pasado por linking-success localmente.
  useEffect(() => {
    if (!deviceId || Platform.OS !== "android") return;
    const { DeviceModule } = NativeModules;
    if (!DeviceModule?.initPollingService) return;
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.39:3003";
    DeviceModule.initPollingService(deviceId as string, apiUrl)
      .then(() => console.log("[DG] Background polling service started from block"))
      .catch((e: any) => console.warn("[DG] initPollingService error:", e));
  }, [deviceId]);


  // Activar modo kiosco cuando estemos en esta pantalla
  const kioskControl = useKioskMode(true);

  // Bloquear navegación: solo permitir ir a payment-methods y volver
  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e: any) => {
      // permite navegar a payment-methods
      if (e.data?.action?.payload?.name === "payment-methods") {
        return;
      }
      // bloquea cualquier otra navegación (botones atrás, etc)
      e.preventDefault();
    });
    return unsub;
  }, [navigation]);

  // Reactivar kiosco cuando se regresa de payment-methods.
  // Si ya se desbloqueó (isUnblockedRef=true), NO reiniciar — evita
  // la race condition donde startKiosk corre DESPUÉS de stopKiosk.
  useFocusEffect(
    React.useCallback(() => {
      if (isUnblockedRef.current) return;
      (async () => {
        try {
          await kioskControl.startKiosk();
        } catch (e) {
          console.warn("Error reactivating kiosk on focus", e);
        }
      })();
    }, [kioskControl])
  );

  // Polling cada 3s para detectar DESBLOQUEO remoto desde la web
  useFocusEffect(
    React.useCallback(() => {
      if (!isReady || !deviceId) return;

      const poll = async () => {
        try {
          const status = await provisioningService.checkStatus(deviceId as string);
          if (!status.blocked && !isUnblockedRef.current) {
            isUnblockedRef.current = true;
            // Detener kiosk y volver a la pantalla principal vinculada
            await kioskControl.stopKiosk();
            router.replace({ pathname: "/linking-success" });
          }
        } catch (e) {
          // Silencioso — reintenta en el siguiente tick
        }
      };

      poll(); // check inmediato
      const intervalId = setInterval(poll, 3000);
      return () => clearInterval(intervalId);
    }, [isReady, deviceId, router, kioskControl])
  );

  const handlePayment = () => {
    router.push("/payment-methods");
  };

  // Cargar monto pendiente cuando tenemos el deviceId
  useEffect(() => {
    if (!isReady || !deviceId) return;
    (async () => {
      try {
        const status = await provisioningService.checkStatus(deviceId);
        setPending(status.pendingAmount);
      } catch (e) {
        console.warn("unable to fetch pending amount", e);
      }
    })();
  }, [isReady, deviceId]);

  return (
    <YStack
      flex={1}
      backgroundColor="#000000"
      paddingHorizontal="$4"
      paddingTop="$10"
      justifyContent="space-between"
      alignItems="center"
    >
      <YStack alignItems="center" gap="$6" marginTop="$6" flex={1}>
        <YStack
          width={140}
          height={140}
          borderRadius={24}
          backgroundColor="#450A0A"
          justifyContent="center"
          alignItems="center"
        >
          <YStack
            width={100}
            height={100}
            borderRadius={16}
            backgroundColor="#1F2937"
            justifyContent="center"
            alignItems="center"
          >
            <FontAwesome name="lock" size={48} color="#DC2626" />
          </YStack>
        </YStack>

        <YStack gap="$3" alignItems="center" paddingHorizontal="$3">
          <Text
            fontSize={28}
            fontWeight="800"
            color="white"
            textAlign="center"
            letterSpacing={-0.5}
          >
            DISPOSITIVO{"\n"}BLOQUEADO
          </Text>
          <Text
            fontSize={14}
            color="#9CA3AF"
            textAlign="center"
            maxWidth={320}
            lineHeight={22}
          >
            El acceso ha sido restringido por falta de pago. Por favor,
            regularice su cuenta para restaurar el acceso.
          </Text>
        </YStack>

        <YStack
          width="100%"
          maxWidth={360}
          borderRadius={16}
          backgroundColor="#1F2937"
          paddingVertical="$5"
          paddingHorizontal="$6"
          gap="$3"
          alignItems="center"
        >
          <Text fontSize={12} color="#9CA3AF" letterSpacing={1}>
            SALDO PENDIENTE
          </Text>
          <Text fontSize={48} color="white" fontWeight="800">
            {pending != null
              ? `$${pending.toFixed(2)}`
              : "--"}
          </Text>
          <YStack flexDirection="row" gap="$2" alignItems="center">
            <YStack
              width={16}
              height={16}
              borderRadius={8}
              backgroundColor="#374151"
              justifyContent="center"
              alignItems="center"
            >
              <FontAwesome name="info" size={10} color="#9CA3AF" />
            </YStack>
            <Text fontSize={12} color="#6B7280">
              Funcionalidad limitada a llamadas de emergencia.
            </Text>
          </YStack>
        </YStack>
      </YStack>

      <YStack width="100%" maxWidth={360} marginBottom="$8" gap="$4">
        <Button
          backgroundColor="#DC2626"
          borderRadius={12}
          height={56}
          onPress={handlePayment}
          pressStyle={{ opacity: 0.85 }}
        >
          <YStack flexDirection="row" gap="$2" alignItems="center">
            <FontAwesome name="credit-card" size={20} color="white" />
            <Text
              color="white"
              fontSize={17}
              fontWeight="800"
              textAlign="center"
            >
              Realizar Pago
            </Text>
          </YStack>
        </Button>

        <Text
          fontSize={10}
          color="#4B5563"
          textAlign="center"
          letterSpacing={0.5}
        >
          ID: DG-8X99-BLOQ-V2
        </Text>
      </YStack>
    </YStack>
  );
}
