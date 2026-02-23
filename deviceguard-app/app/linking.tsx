import { YStack, Text } from "tamagui";
import { LinkingAnimation } from "@/components/linking/LinkingAnimation";
import { LinkingStatus } from "@/components/linking/LinkingStatus";

export default function LinkingScreen() {
  return (
    <YStack flex={1} backgroundColor="#000000" justifyContent="center" alignItems="center" paddingHorizontal="$4">
      <LinkingAnimation />
      
      <YStack gap="$3" alignItems="center" marginTop="$8">
        <Text fontSize={24} fontWeight="600" color="white" textAlign="center">
          Estableciendo conexión segura...
        </Text>
        
        <Text fontSize={12} color="#6B7280" textAlign="center" letterSpacing={2}>
          PROTOCOLO TLS 1.3
        </Text>
      </YStack>

      <LinkingStatus />
    </YStack>
  );
}
