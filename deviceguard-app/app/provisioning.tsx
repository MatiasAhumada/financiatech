import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { YStack, Text, Button } from "tamagui";
import { ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { ProvisioningHeader } from "@/components/provisioning/ProvisioningHeader";
import { CodeInput } from "@/components/provisioning/CodeInput";
import { useProvisioningCode } from "@/src/hooks/useProvisioningCode";
import { useDeviceImei } from "@/src/hooks/useDeviceImei";
import { provisioningService } from "@/src/services/provisioning.service";
import { validateProvisioningCode } from "@/src/utils/validation.util";

const { height } = Dimensions.get("window");

export default function ProvisioningScreen() {
  const router = useRouter();
  const { code, codeString, setCodeString, getFullCode, isComplete } = useProvisioningCode();
  const { deviceId, isReady: isDeviceReady } = useDeviceImei();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkingSync, setCheckingSync] = useState(true);

  // if the device is already synced on the server and marked as blocked we
  // immediately redirect to the block screen so the user never gets to the
  // provisioning flow again. we need to run this both when the screen gains
  // focus and also as soon as the deviceId becomes available (first render).
  const performStatusCheck = async () => {
    if (!isDeviceReady || !deviceId) {
      setCheckingSync(false);
      return;
    }

    try {
      setCheckingSync(true);
      const status = await provisioningService.checkStatus(deviceId);
      if (status.blocked) {
        router.replace({ pathname: "/device-blocked" });
        return;
      }
      if (status.deviceName && status.adminName) {
        router.replace({
          pathname: "/linking-success",
          params: {
            deviceName: status.deviceName,
            deviceId,
            adminName: status.adminName,
          },
        });
        return;
      }
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.warn("status check failed", err);
      }
    } finally {
      setCheckingSync(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      performStatusCheck();
    }, [isDeviceReady, deviceId, router])
  );

  useEffect(() => {
    // also check once when deviceId becomes ready (initial bootstrap)
    if (isDeviceReady && deviceId) {
      performStatusCheck();
    }
  }, [isDeviceReady, deviceId]);

  // El botón está habilitado solo cuando el código está completo Y el deviceId ya fue resuelto
  const canVerify = isComplete() && isDeviceReady && !isLoading;

  // mientras comprobamos sync, no renderizamos nada (evita flash)
  if (isDeviceReady && checkingSync) {
    return null;
  }

  const handleVerify = async () => {
    const fullCode = getFullCode();

    if (!validateProvisioningCode(fullCode)) {
      setErrorMessage("El código debe ser de 6 caracteres alfanuméricos.");
      return;
    }

    if (!deviceId) {
      setErrorMessage("No se pudo identificar el dispositivo. Intenta reiniciar la app.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await provisioningService.syncDevice(fullCode, deviceId);

      // Navega a la pantalla de animación de vinculación pasando los datos
      // reales del dispositivo para que linking-success.tsx los muestre
      router.push({
        pathname: "/linking",
        params: {
          deviceName: result.deviceName,
          deviceId: result.deviceId,
          adminName: result.adminName,
        },
      });
    } catch (error: any) {
      // Log completo en desarrollo para diagnóstico
      if (__DEV__) {
        console.error("[provisioning] syncDevice error:", error?.message, error?.response?.data);
      }

      const serverMessage =
        error?.response?.data?.message ||
        "No se pudo completar la vinculación. Verifica el código e inténtalo de nuevo.";

      router.push({
        pathname: "/linking-error",
        params: { message: serverMessage },
      });
    } finally {
      setIsLoading(false);
    }

  };

  return (
    <YStack flex={1} backgroundColor="#000000">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} paddingTop={height * 0.08} gap="$6">
          <ProvisioningHeader />

          <CodeInput code={code} codeString={codeString} onChangeText={setCodeString} />

          {/* Mensaje de error inline (validación local) */}
          {errorMessage && (
            <YStack backgroundColor="#450A0A" borderRadius={8} paddingHorizontal="$4" paddingVertical="$3">
              <Text color="#FCA5A5" fontSize={13} textAlign="center">
                {errorMessage}
              </Text>
            </YStack>
          )}

          <Button
            backgroundColor="#DC2626"
            borderRadius={10}
            width="100%"
           
            alignSelf="center"
            onPress={handleVerify}
            disabled={!canVerify}
            opacity={!canVerify ? 0.5 : 1}
            pressStyle={{ opacity: 0.8 }}
          >
            <Text color="white" fontSize={18} fontWeight="800">
              {isLoading
                ? "Vinculando..."
                : !isDeviceReady
                ? "Preparando dispositivo..."
                : "Verificar y Vincular"}
            </Text>
          </Button>

        </YStack>
      </ScrollView>
    </YStack>
  );
}
