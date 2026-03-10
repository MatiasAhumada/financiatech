import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { YStack, Text } from "tamagui";
import { LinkingAnimation } from "@/components/linking/LinkingAnimation";
import { LinkingStatus } from "@/components/linking/LinkingStatus";
import { LinkingSteps } from "@/components/linking/LinkingSteps";
import { NativeModules, Platform } from "react-native";

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
    const timeoutId = setTimeout(() => {
      if (Platform.OS === 'android') {
        const { DeviceModule } = NativeModules;
        DeviceModule?.restartApp?.();
      }
    }, 6000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

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
