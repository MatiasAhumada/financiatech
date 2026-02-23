import { useEffect, useState } from "react";
import { YStack, Text } from "tamagui";

const STEPS = [
  "Verificando integridad del sistema",
  "Desbloqueando bootloader",
  "Estableciendo túnel seguro",
  "Validando certificados",
  "Configurando políticas de dispositivo",
  "Sincronizando con servidor",
  "Aplicando restricciones de seguridad",
  "Finalizando vinculación",
];

export function LinkingSteps() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <YStack gap="$2" alignItems="center" marginTop="$6" width="100%" maxWidth={320}>
      {STEPS.map((step, index) => (
        <Text
          key={index}
          fontSize={11}
          color={index === currentStep ? "#10B981" : index < currentStep ? "#6B7280" : "#374151"}
          textAlign="center"
          letterSpacing={1}
          opacity={index <= currentStep ? 1 : 0.3}
        >
          {index < currentStep ? "✓ " : index === currentStep ? "▸ " : ""}
          {step.toUpperCase()}
        </Text>
      ))}
    </YStack>
  );
}
