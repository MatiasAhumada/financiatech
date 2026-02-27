import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { YStack, Text, XStack } from "tamagui";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Dimensions } from "react-native";
import { provisioningService } from "@/src/services/provisioning.service";

const { height } = Dimensions.get("window");

export default function LinkingSuccessScreen() {
  const { deviceName, adminName, deviceId } = useLocalSearchParams<{
    deviceName: string;
    deviceId: string;
    adminName: string;
  }>();

  const router = useRouter();
  const isBlockedRef = useRef(false);

  // chequea cada 3s si el dispositivo fue bloqueado desde la web
  useFocusEffect(
    React.useCallback(() => {
      if (!deviceId) return;

      // ejecuta el check inmediato
      (async () => {
        try {
          const status = await provisioningService.checkStatus(
            deviceId as string
          );
          if (status.blocked) {
            isBlockedRef.current = true;
            router.replace({ pathname: "/device-blocked" });
          }
        } catch (e) {
          console.warn("linking-success initial status check failed", e);
        }
      })();

      // polling cada 3s para detectar cambios en tiempo real
      const intervalId = setInterval(async () => {
        try {
          const status = await provisioningService.checkStatus(
            deviceId as string
          );
          if (status.blocked && !isBlockedRef.current) {
            isBlockedRef.current = true;
            router.replace({ pathname: "/device-blocked" });
          }
        } catch (e) {
          // ignore polling errors silently
        }
      }, 3000);

      return () => clearInterval(intervalId);
    }, [deviceId, router])
  );

  // evita salir de esta pantalla; el dispositivo ya está sincronizado
  // pero permite que se navegue a device-blocked si fue bloqueado
  const navigation = useNavigation();
  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e: any) => {
      // permite la navegación programada a device-blocked (cuando se bloquea remotamente)
      if (e.data?.action?.payload?.name === "device-blocked") {
        return;
      }
      // bloquea intentos manuales del usuario (botones atrás, swipe back, etc)
      e.preventDefault();
    });
    return unsub;
  }, [navigation]);

  return (
    <YStack
      flex={1}
      backgroundColor="#000000"
      paddingHorizontal="$5"
      justifyContent="center"
      alignItems="center"
      gap="$8"
    >
      {/* Badge de éxito */}
      <YStack alignItems="center" gap="$4">
        <YStack
          width={110}
          height={110}
          borderRadius={14}
          backgroundColor="#450A0A"
          borderWidth={2}
          borderColor="#7F1D1D"
          justifyContent="center"
          alignItems="center"
        >
          <YStack
            width={80}
            height={80}
            borderRadius={10}
            backgroundColor="#B91C1C"
            justifyContent="center"
            alignItems="center"
          >
            <FontAwesome name="check" size={40} color="white" />
          </YStack>
        </YStack>

        <YStack gap="$1" alignItems="center" paddingHorizontal="$3">
          <Text fontSize={28} fontWeight="800" color="white" textAlign="center">
            ¡Dispositivo Vinculado!
          </Text>
          <Text
            fontSize={14}
            color="#9CA3AF"
            textAlign="center"
            maxWidth={300}
            lineHeight={20}
          >
            Bajo la protección de{" "}
            <Text fontWeight="700" color="white">
              DeviceGuard
            </Text>
          </Text>
        </YStack>
      </YStack>

      {/* Card principal — grande, centrada, imponente */}
      <YStack
        width="100%"
        borderRadius={28}
        backgroundColor="#0F172A"
        borderWidth={1}
        borderColor="#1E3A5F"
        overflow="hidden"
      >
        {/* Franja superior carmesí */}
        <YStack height={5} backgroundColor="#B91C1C" />

        <YStack paddingVertical="$7" paddingHorizontal="$7" gap="$6">
          {/* ORGANIZACIÓN */}
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <YStack
                width={3}
                height={14}
                borderRadius={2}
                backgroundColor="#B91C1C"
              />
              <Text
                fontSize={11}
                color="#6B7280"
                letterSpacing={1.5}
                fontWeight="600"
              >
                ORGANIZACIÓN
              </Text>
            </XStack>
            <Text
              fontSize={26}
              color="white"
              fontWeight="800"
              letterSpacing={-0.3}
            >
              {adminName || "—"}
            </Text>
          </YStack>

          {/* Divisor */}
          <YStack height={1} backgroundColor="#1E293B" />

          {/* DISPOSITIVO */}
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <YStack
                width={3}
                height={14}
                borderRadius={2}
                backgroundColor="#B91C1C"
              />
              <Text
                fontSize={11}
                color="#6B7280"
                letterSpacing={1.5}
                fontWeight="600"
              >
                DISPOSITIVO
              </Text>
            </XStack>
            <Text
              fontSize={26}
              color="white"
              fontWeight="800"
              letterSpacing={-0.3}
            >
              {deviceName || "—"}
            </Text>
          </YStack>

          {/* Divisor */}
          <YStack height={1} backgroundColor="#1E293B" />

          {/* Estado */}
          <XStack alignItems="center" gap="$3">
            <YStack
              width={10}
              height={10}
              borderRadius={5}
              backgroundColor="#22C55E"
            />
            <Text fontSize={13} color="#22C55E" fontWeight="600">
              Monitoreo activo
            </Text>
          </XStack>
        </YStack>
      </YStack>

      {/* Footer */}
      <Text fontSize={10} color="#374151" letterSpacing={1} textAlign="center">
        DEVICEGUARD SECURITY PROTOCOL V4.6
      </Text>
    </YStack>
  );
}
