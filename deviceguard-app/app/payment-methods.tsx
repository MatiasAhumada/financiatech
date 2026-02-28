import { useRouter } from "expo-router";
import { YStack, Text, Button } from "tamagui";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useKioskMode } from "@/src/hooks/useKioskMode";

export default function PaymentMethodsScreen() {
  const router = useRouter();
  // Mantener kiosk activo: el Lock Task Mode es a nivel de actividad,
  // no de pantalla. Si se detiene aquí, los botones del sistema vuelven.
  useKioskMode(true);

  const handleBack = () => {
    // Navega directamente a device-blocked en lugar de usar router.back()
    // Esto asegura que el navegador reconozca bien la ruta permitida
    router.replace("/device-blocked");
  };

  return (
    <YStack
      flex={1}
      backgroundColor="#000000"
      paddingHorizontal="$4"
      paddingTop="$10"
      justifyContent="space-between"
    >
      <YStack gap="$6" flex={1}>
        <YStack gap="$2" paddingTop="$4">
          <YStack flexDirection="row" alignItems="center" gap="$3">
            <YStack width={4} height={32} backgroundColor="#DC2626" borderRadius={2} />
            <Text fontSize={32} fontWeight="800" color="white" letterSpacing={-1}>
              MÉTODOS DE PAGO
            </Text>
          </YStack>
          <Text fontSize={15} color="#9CA3AF" paddingLeft="$5">
            Seleccione su canal preferido
          </Text>
        </YStack>

        <YStack gap="$4" marginTop="$6">
          <YStack
            backgroundColor="#1F2937"
            borderRadius={20}
            padding="$6"
            gap="$4"
            borderWidth={1}
            borderColor="#374151"
          >
            <YStack flexDirection="row" justifyContent="space-between" alignItems="flex-start">
              <YStack flexDirection="row" gap="$4" alignItems="center" flex={1}>
                <YStack
                  width={56}
                  height={56}
                  borderRadius={14}
                  backgroundColor="#450A0A"
                  justifyContent="center"
                  alignItems="center"
                >
                  <FontAwesome name="money" size={28} color="#DC2626" />
                </YStack>
                <Text fontSize={20} fontWeight="700" color="white">
                  Efectivo
                </Text>
              </YStack>
              <YStack
                width={56}
                height={56}
                borderRadius={14}
                backgroundColor="#374151"
                justifyContent="center"
                alignItems="center"
              >
                <FontAwesome name="money" size={28} color="#6B7280" />
              </YStack>
            </YStack>

            <YStack
              gap="$2"
              paddingTop="$2"
              borderTopWidth={1}
              borderTopColor="#374151"
            >
              <Text fontSize={11} color="#6B7280" letterSpacing={1} fontWeight="600">
                PUNTO DE PAGO:
              </Text>
              <Text fontSize={15} color="#E5E7EB" lineHeight={22}>
                Av. Central 123,{"\n"}Ciudad Capital
              </Text>
            </YStack>
          </YStack>

          <YStack
            backgroundColor="#1F2937"
            borderRadius={20}
            padding="$6"
            gap="$4"
            borderWidth={1}
            borderColor="#374151"
          >
            <YStack flexDirection="row" justifyContent="space-between" alignItems="flex-start">
              <YStack flexDirection="row" gap="$4" alignItems="center" flex={1}>
                <YStack
                  width={56}
                  height={56}
                  borderRadius={14}
                  backgroundColor="#450A0A"
                  justifyContent="center"
                  alignItems="center"
                >
                  <FontAwesome name="bank" size={22} color="#DC2626" />
                </YStack>
                <Text fontSize={20} fontWeight="700" color="white">
                  Transferencia Bancaria
                </Text>
              </YStack>
              <YStack
                width={40}
                height={40}
                borderRadius={10}
                backgroundColor="#374151"
                justifyContent="center"
                alignItems="center"
                marginTop="$2"
              >
                <FontAwesome name="copy" size={16} color="#9CA3AF" />
              </YStack>
            </YStack>

            <YStack
              gap="$3"
              paddingTop="$2"
              borderTopWidth={1}
              borderTopColor="#374151"
            >
              <YStack gap="$1.5">
                <Text fontSize={11} color="#6B7280" letterSpacing={1} fontWeight="600">
                  BANCO
                </Text>
                <Text fontSize={15} color="#E5E7EB" fontWeight="600">
                  Crimson Bank
                </Text>
              </YStack>

              <YStack gap="$1.5">
                <Text fontSize={11} color="#6B7280" letterSpacing={1} fontWeight="600">
                  CUENTA
                </Text>
                <Text fontSize={15} color="#E5E7EB" fontWeight="600">
                  0012-3456-7890
                </Text>
              </YStack>

              <YStack gap="$1.5">
                <Text fontSize={11} color="#6B7280" letterSpacing={1} fontWeight="600">
                  CLABE
                </Text>
                <Text fontSize={15} color="#E5E7EB" fontWeight="600">
                  123456789012345678
                </Text>
              </YStack>
            </YStack>
          </YStack>
        </YStack>
      </YStack>

      <YStack width="100%" marginBottom="$8" gap="$4">
        <Button
          backgroundColor="#E5E7EB"
          borderRadius={14}
          height={56}
          onPress={handleBack}
          pressStyle={{ opacity: 0.85 }}
        >
          <Text
            color="#000000"
            fontSize={17}
            fontWeight="800"
            textAlign="center"
            letterSpacing={1}
          >
            VOLVER
          </Text>
        </Button>

        <Text
          fontSize={10}
          color="#4B5563"
          textAlign="center"
          letterSpacing={0.8}
        >
          PROTOCOLO DE PAGO V3.4
        </Text>
      </YStack>
    </YStack>
  );
}
