import { useLocalSearchParams } from "expo-router";
import { YStack, Text, Button } from "tamagui";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function LinkingSuccessScreen() {
  // Recibe los datos reales del dispositivo vinculado
  const { deviceName, deviceId, adminName } = useLocalSearchParams<{
    deviceName: string;
    deviceId: string;
    adminName: string;
  }>();

  // Una vez vinculado el dispositivo, no hay ninguna pantalla a la que navegar:
  // la app permanece en esta vista como estado final de "equipo gestionado".
  // El botón no hace nada — es intencional para que el usuario simplemente cierre
  // la pantalla de configuración y comience a usar el dispositivo.
  const handleFinish = () => {
    // No navegar. Esta pantalla es el destino final del proceso de vinculación.
    // En futuras versiones aquí se puede navegar a un dashboard de estado del dispositivo.
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
      <YStack alignItems="center" gap="$9" marginTop="$6" flex={1}>
        {/* Badge de éxito */}
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
          <YStack
            width={72}
            height={72}
            borderRadius={8}
            backgroundColor="#B91C1C"
            justifyContent="center"
            alignItems="center"
          >
            <FontAwesome name="check" size={36} color="white" />
          </YStack>
        </YStack>

        <YStack gap="$2" alignItems="center" paddingHorizontal="$3">
          <Text fontSize={26} fontWeight="800" color="white" textAlign="center">
            ¡Dispositivo Vinculado!
          </Text>
          <Text
            fontSize={14}
            color="#9CA3AF"
            textAlign="center"
            maxWidth={320}
            lineHeight={20}
          >
            El dispositivo ahora está bajo la protección de{" "}
            <Text fontWeight="700" color="white">
              DeviceGuard
            </Text>
            . Se han activado los permisos de administrador correctamente.
          </Text>
        </YStack>

        {/* Card con datos reales del dispositivo */}
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
              {adminName || "—"}
            </Text>
          </YStack>

          <YStack
            gap="$1.5"
            paddingTop="$3"
            borderTopWidth={1}
            borderTopColor="#1E293B"
          >
            <Text fontSize={12} color="#6B7280" letterSpacing={0.8}>
              DISPOSITIVO
            </Text>
            <Text fontSize={18} color="white" fontWeight="700">
              {deviceName || "—"}
            </Text>
          </YStack>
        </YStack>
      </YStack>

      <YStack
        width="100%"
        alignSelf="stretch"
        alignItems="center"
        gap="$4"
        paddingBottom="$6"
      >
        <Button
          backgroundColor="#B91C1C"
          borderRadius={12}
          height={56}
          width="100%"
          onPress={handleFinish}
          pressStyle={{ opacity: 0.85 }}
        >
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
