import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { YStack, Text } from "tamagui";
import { LinkingAnimation } from "@/components/linking/LinkingAnimation";
import { LinkingStatus } from "@/components/linking/LinkingStatus";
import { LinkingSteps } from "@/components/linking/LinkingSteps";
import * as Updates from 'expo-updates';

export default function LinkingScreen() {
  const router = useRouter();

  // Recibe los datos reales del dispositivo que vienen desde provisioning.tsx
  // (la vinculación con el servidor ya fue confirmada exitosamente antes de llegar aquí)
  const params = useLocalSearchParams<{
    deviceName: string;
    deviceId: string;
    adminName: string;
  }>();

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        await Updates.reloadAsync();
      } catch (error) {
        console.warn('[LINKING] Error reloading app:', error);
        router.replace({
          pathname: "/linking-success",
          params: {
            deviceName: params.deviceName,
            deviceId: params.deviceId,
            adminName: params.adminName,
          },
        });
      }
    }, 6000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [router, params.deviceName, params.deviceId, params.adminName]);

  return (
    <YStack
      flex={1}
      backgroundColor="#000000"
      justifyContent="center"
      alignItems="center"
      paddingHorizontal="$4"
    >
      <LinkingAnimation />

      <YStack gap="$3" alignItems="center" marginTop="$8">
        <Text fontSize={24} fontWeight="600" color="white" textAlign="center">
          Estableciendo conexión segura...
        </Text>

        <LinkingSteps />
      </YStack>

      <LinkingStatus />
    </YStack>
  );
}
