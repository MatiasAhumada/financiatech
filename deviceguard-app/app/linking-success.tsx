import { useRouter } from "expo-router";
import { YStack, Text, Button } from "tamagui";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function LinkingSuccessScreen() {
  const router = useRouter();

  const handleFinish = () => {
    router.replace("/linking-error");
  };

  return (
    <YStack flex={1} backgroundColor="#000000" paddingHorizontal="$4" paddingTop="$10" justifyContent="space-between" alignItems="center">
      <YStack alignItems="center" gap="$9" marginTop="$6" flex={1}>
        {/* Icono hexagonal tipo badge (carmesí con borde más oscuro) */}
        <YStack
          width={100}
          height={100}
          borderRadius={12}
          backgroundColor="#450A0A"
          borderWidth={2}
          borderColor="#7F1D1D"
          justifyContent="center"
          alignItems="center"
        >
          <YStack width={72} height={72} borderRadius={8} backgroundColor="#B91C1C" justifyContent="center" alignItems="center">
            <FontAwesome name="check" size={36} color="white" />
          </YStack>
        </YStack>

        <YStack gap="$2" alignItems="center" paddingHorizontal="$3">
          <Text fontSize={26} fontWeight="800" color="white" textAlign="center">
            ¡Dispositivo Vinculado!
          </Text>
          <Text fontSize={14} color="#9CA3AF" textAlign="center" maxWidth={320} lineHeight={20}>
            El dispositivo ahora está bajo la protección de{" "}
            <Text fontWeight="700" color="white">
              DeviceGuard
            </Text>
            . Se han activado los permisos de administrador correctamente.
          </Text>
        </YStack>

        {/* Card de información */}
        <YStack
          width="100%"
          alignSelf="stretch"
          borderRadius={22}
          backgroundColor="#0F172A"
          paddingVertical="$5"
          paddingHorizontal="$8"
          marginStart="$7"
          gap="$4"
        >
          <YStack gap="$1.5">
            <Text fontSize={12} color="#6B7280" letterSpacing={0.8}>
              ORGANIZACIÓN
            </Text>
            <Text fontSize={18} color="white" fontWeight="700">
              Corporativo Global S.A.
            </Text>
          </YStack>

          <YStack gap="$1.5" paddingTop="$3" borderTopWidth={1} borderTopColor="#1E293B">
            <Text fontSize={12} color="#6B7280" letterSpacing={0.8}>
              ID DEL DISPOSITIVO
            </Text>
            <Text fontSize={18} color="white" fontWeight="700">
              DG-7724X-PRO
            </Text>
          </YStack>
        </YStack>
      </YStack>

      <YStack width="100%" alignSelf="stretch" alignItems="center" gap="$4" paddingBottom="$6">
        <Button backgroundColor="#B91C1C" borderRadius={12} height={56} width="100%" onPress={handleFinish} pressStyle={{ opacity: 0.85 }}>
          <Text color="white" fontSize={17} fontWeight="800" textAlign="center">
            Finalizar Configuración
          </Text>
        </Button>

        <Text fontSize={10} color="#6B7280" letterSpacing={0.5}>
          DEVICEGUARD SECURITY PROTOCOL V4.6
        </Text>
      </YStack>
    </YStack>
  );
}
