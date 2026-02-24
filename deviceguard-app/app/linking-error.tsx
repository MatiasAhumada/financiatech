import { useRouter } from "expo-router";
import { YStack, Text, Button } from "tamagui";

export default function LinkingErrorScreen() {
  const router = useRouter();

  const handleRetry = () => {
    router.replace("/device-blocked");
  };

  return (
    <YStack
      flex={1}
      backgroundColor="#000000"
      paddingHorizontal="$4"
      paddingTop="$10"
      justifyContent="space-between"
      alignItems="center"
    >
      <YStack alignItems="center" gap="$4" marginTop="$6">
        <YStack
          width={120}
          height={120}
          borderRadius={32}
          backgroundColor="#450A0A"
          justifyContent="center"
          alignItems="center"
        >
          <YStack
            width={80}
            height={80}
            borderRadius={24}
            backgroundColor="#DC2626"
            justifyContent="center"
            alignItems="center"
          >
            <Text fontSize={40} color="white">
              !
            </Text>
          </YStack>
        </YStack>

        <YStack gap="$2" alignItems="center" paddingHorizontal="$3">
          <Text
            fontSize={24}
            fontWeight="800"
            color="white"
            textAlign="center"
          >
            No se pudo vincular
          </Text>
          <Text
            fontSize={14}
            color="#9CA3AF"
            textAlign="center"
            maxWidth={320}
          >
            Hubo un problema al intentar vincular este dispositivo. Revisa tu
            conexión o el código de activación e inténtalo nuevamente.
          </Text>
        </YStack>
      </YStack>

      <YStack width="100%" maxWidth={360} marginBottom="$8" gap="$3">
        <Button
          backgroundColor="#DC2626"
          borderRadius={12}
          height={56}
          onPress={handleRetry}
          pressStyle={{ opacity: 0.85 }}
        >
          <Text
            color="white"
            fontSize={17}
            fontWeight="800"
            textAlign="center"
          >
            Reintentar vinculación
          </Text>
        </Button>

        <Text
          fontSize={12}
          color="#6B7280"
          textAlign="center"
          paddingHorizontal="$4"
        >
          Si el problema persiste, contacta al administrador de tu
          organización.
        </Text>
      </YStack>
    </YStack>
  );
}

