import { useRouter } from "expo-router";
import { YStack, Text, Button } from "tamagui";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function DeviceBlockedScreen() {
  const router = useRouter();

  const handlePayment = () => {
    router.push("/payment-methods");
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
            $45.00
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
